-- ============================================================
-- 별의 정원 - 002_rls_policies.sql
-- ============================================================

alter table profiles enable row level security;
alter table daily_energies enable row level security;
alter table seeds enable row level security;
alter table sounds enable row level security;
alter table user_seeds enable row level security;
alter table plants enable row level security;
alter table presets enable row level security;
alter table collections enable row level security;
alter table subscriptions enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = user_id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = user_id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = user_id);

create policy "daily_energies_select_all" on daily_energies
  for select using (auth.role() = 'authenticated');

create policy "seeds_select_all" on seeds
  for select using (true);

create policy "sounds_select_all" on sounds
  for select using (
    is_premium = false
    or exists (
      select 1 from subscriptions s
      where s.user_id = auth.uid()
        and s.status = 'active'
        and s.expires_at > now()
    )
  );

create policy "user_seeds_select_own" on user_seeds
  for select using (auth.uid() = user_id);

create policy "user_seeds_update_own" on user_seeds
  for update using (auth.uid() = user_id);

create policy "plants_select_own" on plants
  for select using (auth.uid() = user_id);

create policy "plants_insert_own" on plants
  for insert with check (auth.uid() = user_id);

create policy "plants_update_own" on plants
  for update using (auth.uid() = user_id);

create policy "presets_select_own" on presets
  for select using (auth.uid() = user_id);

create policy "presets_delete_own" on presets
  for delete using (auth.uid() = user_id);

create policy "presets_update_own" on presets
  for update using (auth.uid() = user_id);

create policy "presets_insert_own" on presets
  for insert with check (auth.uid() = user_id);

create or replace function check_preset_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preset_count int;
  is_subscribed boolean;
begin
  select exists (
    select 1 from subscriptions
    where user_id = new.user_id and status = 'active' and expires_at > now()
  ) into is_subscribed;

  if is_subscribed then
    return new;
  end if;

  select count(*) into preset_count from presets where user_id = new.user_id;

  if preset_count >= 1 then
    raise exception 'FREE_PRESET_LIMIT_EXCEEDED';
  end if;

  return new;
end;
$$;

create trigger trg_preset_limit before insert on presets
  for each row execute function check_preset_limit();

create policy "collections_select_own" on collections
  for select using (auth.uid() = user_id);

create policy "subscriptions_select_own" on subscriptions
  for select using (auth.uid() = user_id);
