-- ============================================================
-- 별의 정원 - 001_initial_schema.sql
-- 초기 테이블 생성 (기능정의서 v1.0 §8 데이터 엔티티 기준)
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. profiles: 사용자 프로필 (auth.users 1:1 연동)
-- ------------------------------------------------------------
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_date date,  -- nullable: 온보딩 전까지 null (004 트리거·complete-onboarding)
  birth_time_unknown boolean not null default true,
  birth_time text,
  is_lunar boolean not null default false,
  ohang_type text check (ohang_type in ('wood','fire','earth','metal','water')),
  garden_slots int not null default 6,
  total_blooms int not null default 0,
  last_active_at timestamptz not null default now(),
  is_sleeping boolean not null default false,
  onboarding_completed_at timestamptz,
  profile_edit_count_this_month int not null default 0,
  profile_edit_month text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is '생년월일시는 민감정보. NFR-04 참조. 계정 삭제 시 cascade.';

-- ------------------------------------------------------------
-- 2. daily_energies: 일일 오행 에너지 (서버 배치 생성, 듀얼 스키마 대비)
-- ------------------------------------------------------------
create table daily_energies (
  id uuid primary key default gen_random_uuid(),
  energy_date date not null,
  system_type text not null default 'ohang' check (system_type in ('ohang','western')),
  energy_code text not null,
  summary_text text not null,
  generated_by text not null default 'ai' check (generated_by in ('ai','fallback')),
  created_at timestamptz not null default now(),
  unique (energy_date, system_type)
);

comment on table daily_energies is 'FR-B01. pg_cron 00:05 KST 배치 생성. AI 실패 시 fallback 텍스트 사용.';

-- ------------------------------------------------------------
-- 3. sounds: 사운드 마스터 (seeds FK 전에 생성)
-- ------------------------------------------------------------
create table sounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'plant' check (category in ('plant','ambient')),
  file_url_ogg text not null,
  file_url_mp3 text not null,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. seeds: 씨앗/식물 마스터 (read-only public)
-- ------------------------------------------------------------
create table seeds (
  id uuid primary key default gen_random_uuid(),
  species_name text not null unique,
  system_type text not null default 'ohang' check (system_type in ('ohang','western')),
  energy_code text not null,
  rarity text not null default 'normal' check (rarity in ('normal','rare')),
  required_hours int not null,
  sound_id uuid references sounds(id),
  flower_meaning text,
  illustration_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table seeds is 'MVP 15종 = 오행별 일반2 + 희귀1. rarity enum은 향후 epic 확장 고려.';

-- ------------------------------------------------------------
-- 5. user_seeds: 유저가 보유한 씨앗 (인벤토리)
-- ------------------------------------------------------------
create table user_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  seed_id uuid not null references seeds(id),
  granted_date date not null,
  grant_source text not null default 'daily'
    check (grant_source in ('welcome', 'daily', 'premium_monthly')),
  status text not null default 'inventory' check (status in ('inventory','planted')),
  received_at timestamptz not null default now()
);

create unique index idx_user_seeds_daily_unique
  on user_seeds (user_id, granted_date)
  where grant_source = 'daily';

create unique index idx_user_seeds_welcome_unique
  on user_seeds (user_id)
  where grant_source = 'welcome';

comment on table user_seeds is 'FR-C01. 일일 씨앗은 partial unique로 중복 지급 방지. 웰컴 씨앗은 별도 제약.';

-- ------------------------------------------------------------
-- 6. plants: 정원에 심어진 식물 (성장 상태)
-- ------------------------------------------------------------
create table plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  user_seed_id uuid not null references user_seeds(id) on delete cascade,
  slot_index int not null,
  planted_at timestamptz not null default now(),
  care_bonus_hours numeric not null default 0,
  last_watered_at timestamptz,
  starlight_taps_today int not null default 0,
  starlight_date text,
  growth_stage int not null default 0 check (growth_stage in (0,1,2)),
  bloomed_at timestamptz,
  is_sleeping boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, slot_index)
);

comment on table plants is 'FR-C04 성장 엔진. 개화 확정은 confirm-bloom Edge Function에서 서버 검증.';

-- ------------------------------------------------------------
-- 7. presets: 사운드 믹스 프리셋
-- ------------------------------------------------------------
create table presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  name text not null default '나의 믹스',
  mix_config jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. collections: 도감 (최초 개화 기록)
-- ------------------------------------------------------------
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  seed_id uuid not null references seeds(id),
  first_bloomed_at timestamptz not null default now(),
  unique (user_id, seed_id)
);

-- ------------------------------------------------------------
-- 9. subscriptions: 구독 상태
-- ------------------------------------------------------------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  plan text not null check (plan in ('monthly','yearly')),
  status text not null default 'active' check (status in ('active','canceled','expired','past_due')),
  provider text not null check (provider in ('toss','play_billing','app_store')),
  provider_subscription_id text,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 인덱스
-- ------------------------------------------------------------
create index idx_plants_user on plants(user_id);
create index idx_user_seeds_user_status on user_seeds(user_id, status);
create index idx_daily_energies_date on daily_energies(energy_date);
create index idx_subscriptions_user_status on subscriptions(user_id, status);
create index idx_collections_user on collections(user_id);

-- ------------------------------------------------------------
-- updated_at 자동 갱신 트리거
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_presets_updated before update on presets
  for each row execute function set_updated_at();
create trigger trg_subscriptions_updated before update on subscriptions
  for each row execute function set_updated_at();
