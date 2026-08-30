create extension if not exists pgcrypto;

create table if not exists public.flick_rooms (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours')
);

create table if not exists public.flick_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.flick_rooms(id) on delete cascade,
  kind text not null check (kind in ('text','link')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists flick_items_room_created_idx on public.flick_items(room_id, created_at desc);

alter table public.flick_rooms enable row level security;
alter table public.flick_items enable row level security;

create or replace function public.flick_generate_key()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
begin
  for i in 1..12 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.flick_create_room()
returns table (room_key text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  k text;
  kh text;
  target public.flick_rooms%rowtype;
begin
  loop
    k := public.flick_generate_key();
    kh := encode(extensions.digest(k, 'sha256'), 'hex');
    exit when not exists (select 1 from public.flick_rooms r where r.key_hash = kh);
  end loop;

  insert into public.flick_rooms(key_hash) values (kh) returning * into target;
  return query select k, target.expires_at;
end;
$$;

create or replace function public.flick_room_id(room_key text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.id
  from public.flick_rooms r
  where r.key_hash = encode(extensions.digest(upper(regexp_replace(room_key, '[^A-Z2-9]', '', 'g')), 'sha256'), 'hex')
    and r.expires_at > now()
  limit 1;
$$;

create or replace function public.flick_list_items(room_key text)
returns table (id uuid, kind text, content text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  rid uuid;
begin
  rid := public.flick_room_id(room_key);
  if rid is null then raise exception 'room not found or expired'; end if;
  return query
    select i.id, i.kind, i.content, i.created_at
    from public.flick_items i
    where i.room_id = rid
    order by i.created_at desc
    limit 100;
end;
$$;

create or replace function public.flick_add_item(room_key text, item_content text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  inserted_id uuid;
  cleaned text := trim(item_content);
  detected_kind text;
begin
  rid := public.flick_room_id(room_key);
  if rid is null then raise exception 'room not found or expired'; end if;
  if char_length(cleaned) not between 1 and 4000 then raise exception 'invalid content'; end if;
  detected_kind := case when cleaned ~* '^https?://[^[:space:]]+$' then 'link' else 'text' end;
  insert into public.flick_items(room_id, kind, content)
  values (rid, detected_kind, cleaned)
  returning id into inserted_id;
  return inserted_id;
end;
$$;

create or replace function public.flick_delete_item(room_key text, item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
begin
  rid := public.flick_room_id(room_key);
  if rid is null then return false; end if;
  delete from public.flick_items where id = item_id and room_id = rid;
  return found;
end;
$$;

revoke all on table public.flick_rooms from anon, authenticated;
revoke all on table public.flick_items from anon, authenticated;
revoke all on function public.flick_generate_key() from public, anon, authenticated;
revoke all on function public.flick_room_id(text) from public, anon, authenticated;
revoke all on function public.flick_create_room() from public;
revoke all on function public.flick_list_items(text) from public;
revoke all on function public.flick_add_item(text,text) from public;
revoke all on function public.flick_delete_item(text,uuid) from public;
grant execute on function public.flick_create_room() to anon, authenticated;
grant execute on function public.flick_list_items(text) to anon, authenticated;
grant execute on function public.flick_add_item(text,text) to anon, authenticated;
grant execute on function public.flick_delete_item(text,uuid) to anon, authenticated;
