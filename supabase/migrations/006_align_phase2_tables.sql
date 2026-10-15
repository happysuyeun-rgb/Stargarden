-- ============================================================
-- 별의 정원 - 006_align_phase2_tables.sql
-- Phase 2 테이블 필드 정합 + 가입 트리거 보완
-- 선행: 001~005 적용 완료
-- ============================================================

-- ------------------------------------------------------------
-- 0. profiles 스키마 안전 보정 (가입 트리거 선행 조건)
-- 현재 001은 birth_date nullable·onboarding_completed_at·total_blooms 포함.
-- 구버전/수동 스키마 대비용 idempotent 보정.
-- ------------------------------------------------------------
alter table profiles alter column birth_date drop not null;

alter table profiles
  add column if not exists onboarding_completed_at timestamptz;

alter table profiles
  add column if not exists total_blooms int not null default 0;

-- ------------------------------------------------------------
-- 1. notification_settings
-- ------------------------------------------------------------
alter table notification_settings
  add column if not exists seed_reminder_enabled boolean not null default true;

alter table notification_settings
  add column if not exists watering_reminder_time time default '20:00';

alter table notification_settings
  add column if not exists marketing_opt_in_at timestamptz;

-- ------------------------------------------------------------
-- 2. push_tokens
-- ------------------------------------------------------------
alter table push_tokens add column if not exists device_id text;
alter table push_tokens add column if not exists last_registered_at timestamptz default now();

-- 배포 순서 (별도 마이그레이션 또는 배치 후 실행):
-- alter table push_tokens alter column device_id set not null;

alter table push_tokens drop constraint if exists push_tokens_user_id_token_key;
drop index if exists idx_push_tokens_device;
create unique index idx_push_tokens_device on push_tokens(user_id, device_id);

drop policy if exists "push_tokens_insert_own" on push_tokens;
create policy "push_tokens_insert_own" on push_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_tokens_update_own" on push_tokens;
create policy "push_tokens_update_own" on push_tokens
  for update using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. user_seeds grant_source 확장
-- ------------------------------------------------------------
drop index if exists idx_user_seeds_premium_monthly;
create unique index idx_user_seeds_premium_monthly
  on user_seeds (user_id, date_trunc('month', granted_date::timestamp))
  where grant_source = 'premium_monthly';

alter table user_seeds drop constraint if exists user_seeds_grant_source_check;
alter table user_seeds add constraint user_seeds_grant_source_check
  check (grant_source in ('daily', 'welcome', 'premium_monthly', 'event'));

-- ------------------------------------------------------------
-- 4. 가입 트리거: profiles + notification_settings 기본행
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, birth_time_unknown)
  values (new.id, true);

  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 5. 기존 유저 notification_settings backfill
-- ------------------------------------------------------------
insert into notification_settings (user_id)
select p.user_id
from profiles p
left join notification_settings n on n.user_id = p.user_id
where n.user_id is null;
