-- 같은 씨앗을 두 칸에 심지 못하게
alter table plants drop constraint if exists plants_user_seed_unique;
alter table plants add constraint plants_user_seed_unique unique (user_seed_id);

-- 슬롯 범위 (GARDEN_MAX_SLOTS = 12)
alter table plants drop constraint if exists plants_slot_index_range;
alter table plants add constraint plants_slot_index_range check (slot_index >= 0 and slot_index < 12);

-- 정원 슬롯 수 범위 (GARDEN_START_SLOTS 6 ~ GARDEN_MAX_SLOTS 12)
alter table profiles drop constraint if exists profiles_garden_slots_range;
alter table profiles add constraint profiles_garden_slots_range check (garden_slots between 6 and 12);

-- 가입 트리거가 profiles를 만들므로 클라이언트 insert 정책은 불필요
drop policy if exists "profiles_insert_own" on profiles;

-- notification_settings.updated_at 자동 갱신
drop trigger if exists trg_notification_settings_updated on notification_settings;
create trigger trg_notification_settings_updated before update on notification_settings
  for each row execute function set_updated_at();
