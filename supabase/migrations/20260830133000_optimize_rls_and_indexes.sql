create index if not exists rooms_owner_id_idx on public.rooms(owner_id);
create index if not exists room_members_user_id_idx on public.room_members(user_id);
create index if not exists study_status_user_id_idx on public.study_status(user_id);
create index if not exists focus_sessions_task_id_idx on public.focus_sessions(task_id);

drop policy "profiles visible to shared room members" on public.profiles;
drop policy "users update own profile" on public.profiles;
drop policy "members read rooms" on public.rooms;
drop policy "members read memberships" on public.room_members;
drop policy "members read room tasks" on public.daily_tasks;
drop policy "users insert own tasks in joined rooms" on public.daily_tasks;
drop policy "users update own tasks" on public.daily_tasks;
drop policy "users delete own tasks" on public.daily_tasks;
drop policy "members read statuses" on public.study_status;
drop policy "users insert own status" on public.study_status;
drop policy "users update own status" on public.study_status;
drop policy "users read own focus sessions" on public.focus_sessions;
drop policy "users insert own sessions" on public.focus_sessions;

drop function private.shares_room_with(uuid);

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

create function private.shares_room_with(other_user_id uuid, check_user_id uuid)
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
    where mine.user_id = check_user_id and theirs.user_id = other_user_id
  );
$$;

revoke all on function private.is_room_member(uuid, uuid) from public, anon;
revoke all on function private.shares_room_with(uuid, uuid) from public, anon;
grant execute on function private.is_room_member(uuid, uuid) to authenticated;
grant execute on function private.shares_room_with(uuid, uuid) to authenticated;

create policy "profiles visible to shared room members"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.shares_room_with(id, (select auth.uid())));

create policy "users update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read rooms"
on public.rooms for select to authenticated
using (private.is_room_member(id, (select auth.uid())));

create policy "members read memberships"
on public.room_members for select to authenticated
using (private.is_room_member(room_id, (select auth.uid())));

create policy "members read room tasks"
on public.daily_tasks for select to authenticated
using (private.is_room_member(room_id, (select auth.uid())));

create policy "users insert own tasks in joined rooms"
on public.daily_tasks for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_room_member(room_id, (select auth.uid())));

create policy "users update own tasks"
on public.daily_tasks for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "users delete own tasks"
on public.daily_tasks for delete to authenticated
using (user_id = (select auth.uid()));

create policy "members read statuses"
on public.study_status for select to authenticated
using (private.is_room_member(room_id, (select auth.uid())));

create policy "users insert own status"
on public.study_status for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_room_member(room_id, (select auth.uid())));

create policy "users update own status"
on public.study_status for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "users read own focus sessions"
on public.focus_sessions for select to authenticated
using (user_id = (select auth.uid()));

create policy "users insert own sessions"
on public.focus_sessions for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_room_member(room_id, (select auth.uid())));
