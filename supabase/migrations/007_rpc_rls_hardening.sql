-- ============================================================
-- 별의 정원 - 007_rpc_rls_hardening.sql
-- 클라이언트 직접 쓰기 차단 — Edge Function(service_role) 전용
-- 선행: 006 적용 + 가입 테스트 통과 후 배포 권장
-- ============================================================

-- plants: select만 허용
drop policy if exists "plants_insert_own" on plants;
drop policy if exists "plants_update_own" on plants;

-- user_seeds: status 변경은 EF 전용
drop policy if exists "user_seeds_update_own" on user_seeds;

-- profiles: 민감 필드 UPDATE 차단 (display_name/birth 등은 update-profile EF)
drop policy if exists "profiles_update_own" on profiles;

comment on table plants is
  'FR-C04. INSERT/UPDATE는 plant-seed, water-plant, tap-starlight, confirm-bloom, wake-garden EF 전용.';

comment on table user_seeds is
  'INSERT는 grant-daily-seed/complete-onboarding 등 EF 전용. UPDATE(status)는 plant-seed EF 전용.';
