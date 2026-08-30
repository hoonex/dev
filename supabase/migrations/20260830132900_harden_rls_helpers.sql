create schema if not exists private;

create or replace function private.is_room_member(check_room_id uuid, check_user_id uuid default auth.uid())
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

create or replace function private.shares_room_with(other_user_id uuid)
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

grant usage on schema private to authenticated;
revoke all on function private.is_room_member(uuid, uuid) from public, anon;
revoke all on function private.shares_room_with(uuid) from public, anon;
grant execute on function private.is_room_member(uuid, uuid) to authenticated;
grant execute on function private.shares_room_with(uuid) to authenticated;

drop policy "profiles visible to shared room members" on public.profiles;
drop policy "members read rooms" on public.rooms;
drop policy "members read memberships" on public.room_members;
drop policy "members read room tasks" on public.daily_tasks;
drop policy "users insert own tasks in joined rooms" on public.daily_tasks;
drop policy "members read statuses" on public.study_status;
drop policy "users insert own status" on public.study_status;
drop policy "users insert own sessions" on public.focus_sessions;

create policy "profiles visible to shared room members"
on public.profiles for select to authenticated
using (id = auth.uid() or private.shares_room_with(id));

create policy "members read rooms"
on public.rooms for select to authenticated
using (private.is_room_member(id));

create policy "members read memberships"
on public.room_members for select to authenticated
using (private.is_room_member(room_id));

create policy "members read room tasks"
on public.daily_tasks for select to authenticated
using (private.is_room_member(room_id));

create policy "users insert own tasks in joined rooms"
on public.daily_tasks for insert to authenticated
with check (user_id = auth.uid() and private.is_room_member(room_id));

create policy "members read statuses"
on public.study_status for select to authenticated
using (private.is_room_member(room_id));

create policy "users insert own status"
on public.study_status for insert to authenticated
with check (user_id = auth.uid() and private.is_room_member(room_id));

create policy "users insert own sessions"
on public.focus_sessions for insert to authenticated
with check (user_id = auth.uid() and private.is_room_member(room_id));

drop function public.is_room_member(uuid, uuid);
drop function public.shares_room_with(uuid);
