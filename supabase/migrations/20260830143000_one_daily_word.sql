create table if not exists public.one_questions (
  id integer primary key,
  prompt text not null check (char_length(prompt) between 4 and 120)
);

insert into public.one_questions (id, prompt) values
(1,'오늘, 가장 놓치고 싶지 않은 것은?'),
(2,'지금 당신에게 가장 필요한 한 단어는?'),
(3,'요즘 가장 자주 떠오르는 것은?'),
(4,'오늘 당신을 버티게 한 것은?'),
(5,'지금 사라져도 괜찮은 것은?'),
(6,'다시 시작한다면 가장 먼저 챙길 것은?'),
(7,'요즘 가장 믿고 싶은 것은?'),
(8,'오늘의 당신을 한 단어로 남긴다면?'),
(9,'내일 하나만 달라진다면 무엇이었으면 좋겠나요?'),
(10,'지금 가장 멀리하고 싶은 것은?'),
(11,'당신이 가장 오래 기억하고 싶은 것은?'),
(12,'오늘 가장 부족했던 것은?'),
(13,'누군가에게 지금 건네고 싶은 것은?'),
(14,'요즘 당신을 가장 많이 움직이는 것은?'),
(15,'딱 하나 지킬 수 있다면 무엇을 지킬 건가요?'),
(16,'지금 가장 돌아가고 싶은 곳을 한 단어로 말한다면?'),
(17,'오늘 가장 많이 참은 것은?'),
(18,'최근 가장 뜻밖이었던 감정은?'),
(19,'지금의 나에게 가장 어울리는 색은?'),
(20,'오늘 밤 내려놓고 싶은 것은?'),
(21,'당신에게 성공보다 중요한 것은?'),
(22,'요즘 가장 기다리는 것은?'),
(23,'지금 당신이 가장 솔직해지고 싶은 대상은?'),
(24,'오늘 가장 고마웠던 것은?'),
(25,'당신이 잃고 싶지 않은 감각은?'),
(26,'요즘 시간을 가장 많이 쓰는 것은?'),
(27,'오늘 다시 하고 싶은 선택은?'),
(28,'지금 가장 듣고 싶은 말은?'),
(29,'당신에게 휴식은 한 단어로 무엇인가요?'),
(30,'요즘 가장 선명한 기억은?'),
(31,'오늘 하루를 제목으로 붙인다면?')
on conflict (id) do update set prompt = excluded.prompt;

create table if not exists public.one_answers (
  id uuid primary key default extensions.gen_random_uuid(),
  day_key date not null,
  question_id integer not null references public.one_questions(id),
  answer text not null check (char_length(answer) between 1 and 32),
  device_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day_key, device_hash)
);

create index if not exists one_answers_day_created_idx on public.one_answers(day_key, created_at desc);
create index if not exists one_answers_day_answer_idx on public.one_answers(day_key, answer);

alter table public.one_questions enable row level security;
alter table public.one_answers enable row level security;
revoke all on public.one_questions from anon, authenticated;
revoke all on public.one_answers from anon, authenticated;

create or replace function public.one_day_key()
returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Seoul')::date; $$;

create or replace function public.one_question_id(p_day date)
returns integer
language sql
stable
set search_path = ''
as $$ select 1 + mod((p_day - date '2026-01-01'), 31); $$;

create or replace function public.one_get_today()
returns table(day_key date, question_id integer, prompt text, answer_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with d as (select public.one_day_key() as k), q as (select k, public.one_question_id(k) as qid from d)
  select q.k, q.qid, oq.prompt,
    (select count(*) from public.one_answers a where a.day_key = q.k)
  from q join public.one_questions oq on oq.id = q.qid;
$$;

create or replace function public.one_list_words(p_limit integer default 90)
returns table(answer text, count bigint, last_seen timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.answer, count(*)::bigint, max(a.updated_at)
  from public.one_answers a
  where a.day_key = public.one_day_key()
  group by a.answer
  order by count(*) desc, max(a.updated_at) desc
  limit greatest(1, least(coalesce(p_limit, 90), 120));
$$;

create or replace function public.one_submit_answer(p_answer text, p_device_token text)
returns table(id uuid, answer text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := public.one_day_key();
  v_question integer := public.one_question_id(v_day);
  v_answer text := btrim(p_answer);
  v_hash text;
  v_row public.one_answers;
begin
  if p_device_token is null or char_length(p_device_token) < 16 or char_length(p_device_token) > 160 then raise exception 'invalid device token'; end if;
  if v_answer = '' or char_length(v_answer) > 16 or v_answer ~ '\\s' then raise exception 'answer must be one word up to 16 characters'; end if;
  v_hash := encode(extensions.digest(p_device_token, 'sha256'), 'hex');
  insert into public.one_answers(day_key, question_id, answer, device_hash)
  values(v_day, v_question, v_answer, v_hash)
  on conflict(day_key, device_hash) do update set answer = excluded.answer, updated_at = now()
  returning * into v_row;
  return query select v_row.id, v_row.answer, v_row.created_at;
end;
$$;

revoke all on function public.one_day_key() from public;
revoke all on function public.one_question_id(date) from public;
revoke all on function public.one_get_today() from public;
revoke all on function public.one_list_words(integer) from public;
revoke all on function public.one_submit_answer(text,text) from public;
grant execute on function public.one_get_today() to anon, authenticated;
grant execute on function public.one_list_words(integer) to anon, authenticated;
grant execute on function public.one_submit_answer(text,text) to anon, authenticated;
