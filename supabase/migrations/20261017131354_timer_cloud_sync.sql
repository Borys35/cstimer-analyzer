-- Cloud sync for timer sessions and solves.
--
-- Ids are generated on the client (see src/lib/session-state.ts), so rows are
-- keyed by (user_id, id): re-uploading the same local session is an idempotent
-- upsert, and two users can never collide on a client id.
-- Timestamps mirror the client model: unix seconds as bigint.

create table public.timer_sessions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  name text not null check (char_length(name) <= 200),
  puzzle_type text not null check (char_length(puzzle_type) <= 32),
  created_at bigint not null,
  ended_at bigint,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.timer_solves (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  session_id text not null,
  time_ms integer not null check (time_ms >= 0),
  dnf boolean not null default false,
  penalty smallint not null default 0,
  scramble text not null default '' check (char_length(scramble) <= 2000),
  date_sec bigint not null,
  primary key (user_id, id),
  foreign key (user_id, session_id)
    references public.timer_sessions (user_id, id) on delete cascade
);

-- FK lookup + cascade from timer_sessions. (user_id leads both primary keys,
-- so per-user scans are already covered.)
create index timer_solves_user_session_idx on public.timer_solves (user_id, session_id);

-- Keep updated_at honest on session edits.
create function public.timer_sessions_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.timer_sessions_touch_updated_at() from public, anon, authenticated;

create trigger timer_sessions_touch_updated_at
  before update on public.timer_sessions
  for each row execute function public.timer_sessions_touch_updated_at();

-- Row level security: every row belongs to exactly one user.
alter table public.timer_sessions enable row level security;
alter table public.timer_solves enable row level security;

create policy "Users read own sessions" on public.timer_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sessions" on public.timer_sessions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own sessions" on public.timer_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete own sessions" on public.timer_sessions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own solves" on public.timer_solves
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own solves" on public.timer_solves
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own solves" on public.timer_solves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete own solves" on public.timer_solves
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Data API exposure: new tables are not exposed automatically, and older
-- projects hand anon default privileges. Signed-in users only.
revoke all on table public.timer_sessions, public.timer_solves from anon;
grant select, insert, update, delete on table public.timer_sessions, public.timer_solves to authenticated;
