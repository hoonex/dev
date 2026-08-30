create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'member');
create type public.study_state as enum ('studying', 'resting', 'offline');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  avatar_seed text not null default 'forest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  name text not null check (char_length(name) between 1 and 30),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_date date not null,
  title text not null check (char_length(title) between 1 and 80),
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index daily_tasks_room_date_idx on public.daily_tasks(room_id, task_date);
create index daily_tasks_user_date_idx on public.daily_tasks(user_id, task_date);

create table public.study_status (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.study_state not null default 'offline',
  status_message text not null default '' check (char_length(status_message) <= 42),
  since_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.daily_tasks(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 5 and duration_seconds <= 43200),
  created_at timestamptz not null default now(),
  check (ended_at >= started_at)
);

create index focus_sessions_user_started_idx on public.focus_sessions(user_id, started_at desc);
create index focus_sessions_room_started_idx on public.focus_sessions(room_id, started_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(split_part(new.email, '@', 1), ''), '친구'), 24)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.generate_room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.create_study_room(room_name text)
returns table (id uuid, name text, code text, owner_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_room public.rooms%rowtype;
  candidate text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if char_length(trim(room_name)) not between 1 and 30 then raise exception 'invalid room name'; end if;

  loop
    candidate := public.generate_room_code();
    exit when not exists (select 1 from public.rooms r where r.code = candidate);
  end loop;

  insert into public.rooms (code, name, owner_id)
  values (candidate, trim(room_name), auth.uid())
  returning * into new_room;

  insert into public.room_members (room_id, user_id, role)
  values (new_room.id, auth.uid(), 'owner');

  insert into public.study_status (room_id, user_id, status, status_message)
  values (new_room.id, auth.uid(), 'resting', '준비 중');

  return query select new_room.id, new_room.name, new_room.code, new_room.owner_id, new_room.created_at;
end;
$$;

create or replace function public.join_study_room(room_code text)
returns table (id uuid, name text, code text, owner_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.rooms%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;

  select r.* into target
  from public.rooms r
  where r.code = upper(trim(room_code)) and r.archived_at is null;

  if target.id is null then raise exception 'room not found'; end if;

  insert into public.room_members (room_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (room_id, user_id) do nothing;

  insert into public.study_status (room_id, user_id, status, status_message)
  values (target.id, auth.uid(), 'resting', '방에 들어왔어요')
  on conflict (room_id, user_id) do nothing;

  return query select target.id, target.name, target.code, target.owner_id, target.created_at;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.create_study_room(text) from public, anon;
revoke all on function public.join_study_room(text) from public, anon;
grant execute on function public.create_study_room(text) to authenticated;
grant execute on function public.join_study_room(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.study_status enable row level security;
alter table public.focus_sessions enable row level security;

create or replace function public.is_room_member(check_room_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = check_room_id and m.user_id = check_user_id
  );
$$;

create or replace function public.shares_room_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members mine
    join public.room_members theirs on theirs.room_id = mine.room_id
    where mine.user_id = auth.uid() and theirs.user_id = other_user_id
  );
$$;

revoke all on function public.is_room_member(uuid, uuid) from public, anon;
revoke all on function public.shares_room_with(uuid) from public, anon;
grant execute on function public.is_room_member(uuid, uuid) to authenticated;
grant execute on function public.shares_room_with(uuid) to authenticated;

create policy "profiles visible to shared room members"
on public.profiles for select to authenticated
using (id = auth.uid() or public.shares_room_with(id));

create policy "users update own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "members read rooms"
on public.rooms for select to authenticated
using (public.is_room_member(id));

create policy "members read memberships"
on public.room_members for select to authenticated
using (public.is_room_member(room_id));

create policy "members read room tasks"
on public.daily_tasks for select to authenticated
using (public.is_room_member(room_id));

create policy "users insert own tasks in joined rooms"
on public.daily_tasks for insert to authenticated
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy "users update own tasks"
on public.daily_tasks for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users delete own tasks"
on public.daily_tasks for delete to authenticated
using (user_id = auth.uid());

create policy "members read statuses"
on public.study_status for select to authenticated
using (public.is_room_member(room_id));

create policy "users insert own status"
on public.study_status for insert to authenticated
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy "users update own status"
on public.study_status for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users read own focus sessions"
on public.focus_sessions for select to authenticated
using (user_id = auth.uid());

create policy "users insert own sessions"
on public.focus_sessions for insert to authenticated
with check (user_id = auth.uid() and public.is_room_member(room_id));

alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.daily_tasks;
alter publication supabase_realtime add table public.study_status;

revoke all on function public.generate_room_code() from public, anon, authenticated;
