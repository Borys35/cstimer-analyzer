-- Project default privileges also hand authenticated TRUNCATE, TRIGGER and
-- REFERENCES on new public tables. TRUNCATE ignores RLS, so keep only the
-- four DML privileges the app needs (RLS then scopes them to own rows).
revoke all on table public.timer_sessions, public.timer_solves from authenticated;
grant select, insert, update, delete on table public.timer_sessions, public.timer_solves to authenticated;
