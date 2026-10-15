-- ============================================================
-- 별의 정원 - 005_phase2_tables.sql
-- Phase 2용 테이블 (스키마 선행 정의, Edge Function 연동 대기)
-- ============================================================

create table daily_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  insight_date date not null,
  relation_text text not null,
  advice_cards jsonb not null default '[]',
  recommended_mix jsonb not null default '[]',
  generated_by text not null default 'ai' check (generated_by in ('ai', 'fallback')),
  created_at timestamptz not null default now(),
  unique (user_id, insight_date)
);

create table notification_settings (
  user_id uuid primary key references profiles(user_id) on delete cascade,
  seed_reminder_time time not null default '08:00',
  watering_reminder_enabled boolean not null default false,
  bloom_reminder_enabled boolean not null default true,
  marketing_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('web', 'android', 'ios')),
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table daily_insights enable row level security;
alter table notification_settings enable row level security;
alter table push_tokens enable row level security;

create policy "daily_insights_select_own" on daily_insights
  for select using (auth.uid() = user_id);

create policy "notification_settings_select_own" on notification_settings
  for select using (auth.uid() = user_id);

create policy "notification_settings_update_own" on notification_settings
  for update using (auth.uid() = user_id);

create policy "notification_settings_insert_own" on notification_settings
  for insert with check (auth.uid() = user_id);

create policy "push_tokens_select_own" on push_tokens
  for select using (auth.uid() = user_id);

create policy "push_tokens_delete_own" on push_tokens
  for delete using (auth.uid() = user_id);

create index idx_daily_insights_user_date on daily_insights(user_id, insight_date);
