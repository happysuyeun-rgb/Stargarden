-- ============================================================
-- 별의 정원 - 004_auth_trigger.sql
-- 회원가입 시 빈 프로필 자동 생성 (온보딩 전 birth_date nullable)
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, birth_time_unknown)
  values (new.id, true);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
