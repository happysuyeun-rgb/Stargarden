# 별의 정원 — API 명세서 v1.0

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.0 |
| 작성일 | 2026-10-15 |
| 대상 | Supabase Edge Function 14종 |
| 기준 | 마이그레이션 001~007, 기능정의서 v1.1, `_shared/gameConstants.ts` |
| 관련 문서 | [에러케이스 정의서 v1.0](에러케이스정의서_v1.0_2026-10-15.md), [기획 보완 2026-10-15](기획보완사항_2026-10-15.md) |

> **결정 대기 표시**: 기획 결정이 필요한 부분은 `⏸ 결정 대기`로 표시했다. 해당 부분은 현재 정책대로 구현하되, 결정 후 이 문서를 갱신한다.

---

## 1. 공통 규칙

### 1.1 호출 방식

- 클라이언트는 `supabase.functions.invoke(name, { body })`로만 호출한다 (`src/lib/api.ts`의 `invokeEdgeFunction`).
- 모든 요청은 `POST`, 본문은 JSON이다.
- 이름은 kebab-case 그대로 쓴다 (예: `water-plant`).

### 1.2 인증

| 구분 | 함수 | 인증 방식 | `verify_jwt` |
|---|---|---|---|
| 사용자 | 아래 3개를 제외한 11종 | `Authorization: Bearer <사용자 JWT>` (supabase-js가 자동 첨부) | `true` (기본값) |
| 예약 작업 | `generate-daily-energy`, `send-push` | `x-cron-secret` 헤더 값이 `CRON_SECRET`과 일치 | `false` |
| 결제 웹훅 | `verify-purchase`의 웹훅 경로 | 결제사 서명 검증 | `false` |

- 사용자 함수는 JWT에서 `user_id`를 꺼내 쓴다. **요청 본문의 `user_id`는 받지 않는다.**
- `verify_jwt = false`인 함수는 `supabase/config.toml`에 `[functions.<이름>]`으로 명시한다.
- `x-cron-secret`은 존재 여부가 아니라 **값을 비교**한다. 환경변수가 없으면 무조건 401.

### 1.3 응답 형식

성공:
```json
{ "ok": true, "data": { } }
```

실패:
```json
{ "ok": false, "error": { "code": "ALREADY_WATERED", "message": "오늘은 이미 물을 주었어요" } }
```

- `code`는 클라이언트 분기용 영문 상수, `message`는 화면에 그대로 보여줄 수 있는 한국어 문구다 (압박 없는 톤).
- 상세 문구와 화면 처리는 에러케이스 정의서에서 확정한다.

### 1.4 공통 에러 코드

| HTTP | code | 상황 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 요청 형식 오류, 필수값 누락 |
| 401 | `UNAUTHORIZED` | JWT 없음·만료, cron secret 불일치 |
| 403 | `FORBIDDEN` | 다른 사용자의 데이터 접근 |
| 403 | `PREMIUM_REQUIRED` | 구독 필요 기능 |
| 404 | `NOT_FOUND` | 대상 없음 (본인 소유가 아닌 경우도 404로 응답해 존재 여부를 숨김) |
| 409 | `NOT_ONBOARDED` | 온보딩 미완료 상태에서 정원 기능 호출 |
| 409 | `GARDEN_SLEEPING` | 정원이 잠든 상태 |
| 429 | `RATE_LIMITED` | 호출 빈도 초과 |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |
| 501 | `NOT_IMPLEMENTED` | 스텁 (현재 14종 전부) |

### 1.5 클라이언트 에러 처리 (`src/lib/api.ts` 수정 필요)

supabase-js는 2xx가 아닌 응답을 `FunctionsHttpError`로 던지고, `error.message`에는 서버가 보낸 `code`가 들어 있지 않다. 현재 `invokeEdgeFunction`은 `error.message`만 반환하므로 아래처럼 바꾼다.

```ts
if (error) {
  const body = await error.context?.json?.().catch(() => null)
  return { data: null, error: body?.error ?? { code: 'NETWORK_ERROR', message: '연결이 잠시 끊겼어요' } }
}
return { data: (data as { data: T }).data, error: null }
```

반환 타입의 `error`는 `string`이 아니라 `{ code: string; message: string } | null`로 바꾼다.

### 1.6 날짜와 시간

- 날짜 판단은 모두 **서버 시각, KST** 기준이다. 클라이언트가 보낸 시각은 쓰지 않는다.
- 날짜 문자열은 `YYYY-MM-DD` (예: `2026-10-15`).
- SQL에서 KST 날짜: `(now() at time zone 'Asia/Seoul')::date`
- Deno에서 KST 날짜: `new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })`
- 시각은 ISO 8601 UTC 문자열로 응답한다.

### 1.7 여러 테이블을 바꾸는 처리는 SQL 함수로 묶는다

supabase-js로 여러 번 쓰면 중간에 실패했을 때 데이터가 반쯤만 바뀐다 (예: 씨앗은 `planted`인데 식물 행은 없음). 두 테이블 이상을 바꾸는 함수는 **PostgreSQL 함수 하나로 묶어 한 트랜잭션으로 실행**하고, Edge Function은 그 함수를 `rpc()`로 호출한다.

| Edge Function | 내부 SQL 함수 (예시 이름) | 묶는 변경 |
|---|---|---|
| `complete-onboarding` | `sg_complete_onboarding` | profiles UPDATE + user_seeds INSERT |
| `plant-seed` | `sg_plant_seed` | user_seeds UPDATE + plants INSERT |
| `tap-starlight` | `sg_tap_starlight` | plants 행 잠금 후 UPDATE |
| `confirm-bloom` | `sg_confirm_bloom` | plants + collections + profiles |
| `touch-active` | `sg_touch_active` | profiles + plants |
| `wake-garden` | `sg_wake_garden` | profiles + plants |

- SQL 함수는 `security definer`, `set search_path = public`으로 만든다.
- **클라이언트가 직접 호출할 수 없게** `revoke execute on function ... from public, anon, authenticated;` 후 `grant execute ... to service_role;`을 반드시 붙인다. 이걸 빠뜨리면 클라이언트가 Edge Function 검증을 건너뛰고 SQL 함수를 바로 부를 수 있다.
- 클라이언트 입장에서는 여전히 Edge Function만 호출한다. 기능정의서의 "Edge Function으로 통일" 원칙은 그대로다.

### 1.8 공통 데이터 형태

**PlantDTO** — 식물을 반환하는 모든 함수가 같은 형태를 쓴다.

```ts
interface PlantDTO {
  id: string
  user_seed_id: string
  seed_id: string
  species_name: string
  energy_code: 'wood' | 'fire' | 'earth' | 'metal' | 'water'
  rarity: 'normal' | 'rare'
  required_hours: number        // seeds JOIN
  slot_index: number
  planted_at: string
  care_bonus_hours: number
  last_watered_at: string | null
  starlight_taps_today: number
  starlight_date: string | null // KST YYYY-MM-DD
  growth_stage: 0 | 1 | 2
  bloomed_at: string | null
  is_sleeping: boolean
  progress: number              // 응답 시점 서버 계산값, 0 이상 (1 이상이면 개화 가능)
}
```

**UserSeedDTO**

```ts
interface UserSeedDTO {
  id: string                    // user_seeds.id
  seed_id: string
  species_name: string
  energy_code: 'wood' | 'fire' | 'earth' | 'metal' | 'water'
  rarity: 'normal' | 'rare'
  grant_source: 'welcome' | 'daily' | 'premium_monthly' | 'event'
  granted_date: string          // KST YYYY-MM-DD
  status: 'inventory' | 'planted'
}
```

클라이언트는 응답을 받아 camelCase 스토어 타입(`GardenPlant`, `InventorySeed`)으로 바꾸는 변환 함수를 한곳(`src/lib/mappers.ts` 등)에 둔다.

### 1.9 성장 진행률 계산 (서버 기준)

```
progress = (경과 시간(h) + care_bonus_hours) / required_hours
경과 시간 = now − planted_at   (잠든 상태면 now 대신 잠든 시각까지)
required_hours = seeds.required_hours  (plants → user_seeds → seeds JOIN)
```

클라이언트가 계산한 값은 화면 표시용이고, 개화 확정은 서버 계산만 믿는다.

---

## 2. 함수 목록

| # | 함수 | 호출 시점 | 구현 단계 |
|---|---|---|---|
| 1 | `complete-onboarding` | 기질 결과 화면 → 정원 진입 직전 1회 | 2-C |
| 2 | `update-profile` | 마이 → 프로필 수정 저장 | 2-B |
| 3 | `touch-active` | 앱 시작·앱이 다시 화면에 나올 때 | 2-C |
| 4 | `wake-garden` | 깨어남 모달 확인 | 2-C |
| 5 | `grant-daily-seed` | 정원 진입 시 오늘 씨앗이 없을 때 | 2-D |
| 6 | `plant-seed` | 빈 칸 선택해 심기 | 2-C |
| 7 | `water-plant` | 물주기 버튼 | 2-C |
| 8 | `tap-starlight` | 별빛 쬐기 (탭을 모아서 전송) | 2-C |
| 9 | `confirm-bloom` | 진행률 100% 도달 후 개화 모달 | 2-D |
| 10 | `get-daily-insight` | 심층 해석 화면 진입 | 2-D |
| 11 | `generate-daily-energy` | 예약 작업, 매일 00:05 KST | 2-D |
| 12 | `send-push` | 예약 작업 | 2-E |
| 13 | `verify-purchase` | 결제 완료 직후, 결제사 웹훅 | 2-F |
| 14 | `delete-account` | 마이 → 계정 삭제 | 2-F |

권장 구현 순서: `water-plant` → `tap-starlight` → `plant-seed` → `touch-active` → `wake-garden` → `complete-onboarding` → `grant-daily-seed` → `confirm-bloom` → 나머지.

---

## 3. 함수별 명세

### 3.1 `complete-onboarding`

오행 기질을 서버에서 산출하고, 웰컴 씨앗을 한 번만 지급한다.

**요청**
```json
{
  "birth_date": "1990-05-12",
  "is_lunar": false,
  "birth_time_unknown": false,
  "birth_time": "o"
}
```

| 필드 | 타입 | 규칙 |
|---|---|---|
| `birth_date` | string | `YYYY-MM-DD`, 실재하는 날짜, KST 오늘 이전 |
| `is_lunar` | boolean | 필수 |
| `birth_time_unknown` | boolean | 필수 |
| `birth_time` | string \| null | `birth_time_unknown = false`면 필수. 시진 코드 12종 중 하나: `ja chuk in myo jin sa o mi shin yu sul hae` |

**검증 순서**
1. 요청 형식 → `VALIDATION_ERROR`
2. 만 14세 미만 (KST 오늘 기준) → `AGE_RESTRICTED` (403)
3. `profiles.onboarding_completed_at`이 이미 있음 → `ALREADY_ONBOARDED` (409)

**처리** (`sg_complete_onboarding`, 한 트랜잭션)
1. 오행 산출 — ⏸ 결정 대기 (사주 산출 규칙서). 확정 전까지는 클라이언트 스텁과 같은 규칙(`일(日) % 5`)을 서버에 둔다.
2. `profiles` UPDATE: `birth_date`, `is_lunar`, `birth_time_unknown`, `birth_time`, `ohang_type`, `onboarding_completed_at = now()`
3. 웰컴 씨앗: `seeds`에서 `energy_code = ohang_type AND rarity = 'normal' AND is_active` 중 무작위 1종
4. `user_seeds` INSERT: `grant_source = 'welcome'`, `granted_date = KST 오늘`, `status = 'inventory'`
5. `idx_user_seeds_welcome_unique` 위반 시 기존 웰컴 씨앗을 반환 (재시도 안전)

**응답 200** — 현재 `src/lib/api.ts`의 `CompleteOnboardingResult`와 같은 형태를 유지한다.
```json
{
  "ok": true,
  "data": {
    "ohang_type": "water",
    "user_seed_id": "…",
    "seed_id": "b0000001-0000-0000-0000-00000000000d",
    "species_name": "물망초"
  }
}
```

**에러**: `VALIDATION_ERROR`, `AGE_RESTRICTED`, `ALREADY_ONBOARDED`

---

### 3.2 `update-profile`

닉네임과 생년월일시를 수정한다. 생년월일시 변경은 KST 기준 한 달에 한 번이다.

**요청** (바꿀 필드만 보냄)
```json
{
  "display_name": "서아",
  "birth_date": "1990-05-12",
  "is_lunar": false,
  "birth_time_unknown": true,
  "birth_time": null
}
```

**규칙**
- `display_name`: 1~20자, 앞뒤 공백 제거. 횟수 제한 없음.
- 생년월일시 4개 필드 중 하나라도 **실제 값이 바뀌면** 월 1회 제한을 적용한다. 같은 값이면 횟수를 쓰지 않는다.
- 월 판단: `profile_edit_month`가 KST 이번 달(`YYYY-MM`)과 다르면 `profile_edit_count_this_month`를 0으로 보고 계산한다.
- 생년월일시 검증은 `complete-onboarding`과 같다 (14세 제한 포함).

**검증 순서**: 형식 → `NOT_ONBOARDED` → 생년월일시 변경 시 `EDIT_LIMIT_REACHED`(409) → `AGE_RESTRICTED`

**처리**
1. 생년월일시가 바뀌면 오행 재산출, `profile_edit_count_this_month + 1`, `profile_edit_month = 이번 달`
2. 이미 심은 식물과 보유 씨앗은 바꾸지 않는다.

**응답 200**
```json
{
  "ok": true,
  "data": {
    "display_name": "서아",
    "ohang_type": "water",
    "ohang_changed": false,
    "birth_edits_left_this_month": 0
  }
}
```

**에러**: `VALIDATION_ERROR`, `NOT_ONBOARDED`, `EDIT_LIMIT_REACHED`, `AGE_RESTRICTED`

---

### 3.3 `touch-active`

접속을 기록하고, 오래 비웠으면 정원을 잠재운다.

**요청**: `{}`

**처리** (`sg_touch_active`)
1. 갱신 **전** `profiles.last_active_at`을 읽는다.
2. 공백이 `SLEEP_THRESHOLD_DAYS`(30일) 이상이고 아직 잠들지 않았다면: `profiles.is_sleeping = true`, 해당 유저 `plants.is_sleeping = true`, 잠든 시각 기록 (아래 비고 참조)
3. `profiles.last_active_at = now()`
4. **`profiles.is_sleeping`이 `true`이면 공백 길이와 상관없이 `needs_wake_modal = true`**를 반환한다. (클라이언트에서 발견된 "영구 잠듦" 버그를 서버에서 반복하지 않기 위함)

**응답 200**
```json
{
  "ok": true,
  "data": { "needs_wake_modal": true, "days_away": 34, "today": "2026-10-15" }
}
```

**호출 빈도**: 앱 시작 1회, 앱이 백그라운드에서 돌아올 때 1회. 1분 안에 다시 오면 DB를 쓰지 않고 같은 결과를 반환해도 된다.

**비고 — ⏸ 결정 대기 (잠듦 정책 A/B안)**
- 잠든 기간을 성장에서 빼려면 **잠든 시각을 저장할 컬럼이 필요한데 현재 스키마에 없다.** A안 또는 현행 동결 방식을 유지하면 `profiles.slept_at timestamptz` 추가 마이그레이션이 필요하다.
- B안(잠듦은 연출만)으로 가면 2번의 `plants.is_sleeping` 변경과 컬럼 추가가 필요 없다.

---

### 3.4 `wake-garden`

깨어남 모달을 확인하면 정원을 깨운다.

**요청**: `{}`

**처리** (`sg_wake_garden`)
1. `profiles.is_sleeping = false`이면 아무것도 바꾸지 않고 `awakened: false`로 응답한다 (중복 호출 안전).
2. 아직 피지 않은 식물은 `planted_at`을 잠든 시간만큼 뒤로 미룬다: `planted_at = planted_at + (now() − slept_at)` — ⏸ 결정 대기, `slept_at` 컬럼 필요 (3.3 비고)
3. `profiles.is_sleeping = false`, 해당 유저 `plants.is_sleeping = false`, `slept_at = null`

**응답 200**
```json
{ "ok": true, "data": { "awakened": true, "plants": [ /* PlantDTO[] */ ] } }
```

---

### 3.5 `grant-daily-seed`

오늘의 씨앗을 하루 한 번 지급한다. 이미 받았으면 오늘 받은 씨앗을 그대로 돌려준다.

**요청**: `{}` — 오늘의 에너지는 클라이언트가 보내지 않고 서버가 정한다.

**검증**: `NOT_ONBOARDED`

**처리**
1. KST 오늘 `grant_source = 'daily'` 씨앗이 있으면 → `already_granted: true`로 그 씨앗 반환
2. 오늘의 에너지: `daily_energies`에서 `energy_date = 오늘, system_type = 'ohang'`. 없으면 `generate-daily-energy`와 같은 산출 규칙으로 계산 (배치 실패 대비)
3. 희귀 여부: `random() < RARE_PROBABILITY(0.15)`. 해당 희귀도의 활성 씨앗이 없으면 일반으로 대체
4. 오늘 에너지 + 희귀도에 맞는 활성 씨앗 중 무작위 1종
5. `user_seeds` INSERT (`grant_source = 'daily'`, `granted_date = 오늘`)
6. `idx_user_seeds_daily_unique` 위반(동시 요청) → 이미 들어간 행을 조회해 `already_granted: true`로 반환

잠든 상태에서도 지급한다 (씨앗은 주머니에 들어갈 뿐 정원을 바꾸지 않음).

**응답 200**
```json
{
  "ok": true,
  "data": {
    "already_granted": false,
    "energy_code": "water",
    "user_seed": { /* UserSeedDTO */ }
  }
}
```

**에러**: `NOT_ONBOARDED`

---

### 3.6 `plant-seed`

주머니의 씨앗을 빈 칸에 심는다.

**요청**
```json
{ "user_seed_id": "…", "slot_index": 3 }
```

| 필드 | 규칙 |
|---|---|
| `user_seed_id` | uuid |
| `slot_index` | 정수, `0 ≤ slot_index < profiles.garden_slots` |

**검증 순서**
1. 형식 → `VALIDATION_ERROR`
2. 씨앗이 없거나 본인 소유가 아님 → `NOT_FOUND`
3. 씨앗 `status = 'planted'` → `SEED_ALREADY_PLANTED` (409)
4. 칸 범위 밖 → `SLOT_OUT_OF_RANGE` (400)
5. 칸에 이미 식물 있음 → `SLOT_OCCUPIED` (409)

**처리** (`sg_plant_seed`, 한 트랜잭션)
1. `update user_seeds set status = 'planted' where id = $1 and user_id = $2 and status = 'inventory'` — 0행이면 3번 에러
2. `plants` INSERT (`planted_at = now()`, `care_bonus_hours = 0`, `growth_stage = 0`, `is_sleeping = profiles.is_sleeping`)
3. `unique(user_id, slot_index)` 위반 → `SLOT_OCCUPIED`로 변환

잠든 상태에서도 심을 수 있다 (설계보완 v1.3.1 §7).

**응답 200**
```json
{ "ok": true, "data": { "plant": { /* PlantDTO */ } } }
```

**비고 — ⏸ 결정 대기 (개화 후 식물 처리)**: 빈 칸이 없을 때의 동작(`GARDEN_FULL`)과 개화한 식물을 비우는 방법은 게임 규칙서에서 정한 뒤 추가한다.

---

### 3.7 `water-plant`

KST 하루 한 번 물을 주고 성장 6시간을 더한다.

**요청**
```json
{ "plant_id": "…" }
```

**처리** — 조건부 UPDATE 한 번으로 처리해 동시 호출에도 한 번만 반영되게 한다.

```sql
update plants p
set care_bonus_hours = care_bonus_hours + 6,   -- CARE_BONUS.watering
    last_watered_at = now()
where p.id = $1 and p.user_id = $2
  and p.bloomed_at is null
  and p.is_sleeping = false
  and (p.last_watered_at is null
       or (p.last_watered_at at time zone 'Asia/Seoul')::date
          < (now() at time zone 'Asia/Seoul')::date)
returning p.*;
```

0행이면 식물을 다시 조회해 원인을 판별한다.

| 원인 | code | HTTP |
|---|---|---|
| 식물 없음·본인 소유 아님 | `NOT_FOUND` | 404 |
| 이미 개화 | `PLANT_ALREADY_BLOOMED` | 409 |
| 잠든 상태 | `GARDEN_SLEEPING` | 409 |
| 오늘 이미 줌 | `ALREADY_WATERED` | 409 |

**응답 200**
```json
{ "ok": true, "data": { "plant": { /* PlantDTO */ }, "bonus_added_hours": 6 } }
```

---

### 3.8 `tap-starlight`

별빛 탭을 모아서 보낸다. 10탭마다 30분, 하루 최대 2시간(40탭)이다.

**요청**
```json
{ "plant_id": "…", "taps": 12 }
```

| 필드 | 규칙 |
|---|---|
| `taps` | 정수 1~40. 클라이언트는 탭을 바로 보내지 않고 **마지막 탭 후 1초** 또는 팝오버를 닫을 때 모아서 보낸다 |

**처리** (`sg_tap_starlight`, 행 잠금 `select ... for update`)
1. 검증: `NOT_FOUND`, `PLANT_ALREADY_BLOOMED`, `GARDEN_SLEEPING`
2. `starlight_date`가 KST 오늘이 아니면 `starlight_taps_today = 0`으로 보고 계산
3. 하루 상한 탭 수 `cap = starlightDailyCap / starlight × 10 = 40`
4. `accepted = min(taps, cap − starlight_taps_today)` (0 미만이면 0)
5. 더할 보너스 = `(floor((기존 + accepted) / 10) − floor(기존 / 10)) × 0.5`
6. `starlight_taps_today = 기존 + accepted`, `starlight_date = 오늘`, `care_bonus_hours += 보너스`

상한에 도달해도 에러가 아니다. `accepted_taps: 0`, `cap_reached: true`로 응답한다 (압박 없는 UX).

**응답 200**
```json
{
  "ok": true,
  "data": {
    "plant": { /* PlantDTO */ },
    "accepted_taps": 12,
    "bonus_added_hours": 0.5,
    "today_bonus_hours": 1.0,
    "cap_reached": false
  }
}
```

---

### 3.9 `confirm-bloom`

서버가 진행률을 다시 계산해 100%를 확인한 뒤 개화를 확정한다.

**요청**
```json
{ "plant_id": "…" }
```

**검증 순서**
1. `NOT_FOUND`
2. 이미 `bloomed_at`이 있음 → **에러 아님**, `already_bloomed: true`로 현재 상태 반환 (중복 호출 안전)
3. 잠든 상태 → `GARDEN_SLEEPING` (409)
4. 서버 진행률 < 1 → `NOT_READY` (409), 응답에 `remaining_hours` 포함 (클라이언트 시계가 빠른 경우 대비)

**처리** (`sg_confirm_bloom`, 한 트랜잭션)
1. `plants.growth_stage = 2`, `bloomed_at = now()`
2. `collections` INSERT `on conflict (user_id, seed_id) do nothing` → 새로 들어갔으면 `is_new_collection = true`
3. `profiles.total_blooms += 1`
4. `profiles.garden_slots = least(12, 6 + floor(total_blooms / 5))` → 늘었으면 `slot_unlocked = true`

**응답 200**
```json
{
  "ok": true,
  "data": {
    "already_bloomed": false,
    "plant": { /* PlantDTO */ },
    "sound_id": "a0000001-0000-0000-0000-000000000006",
    "is_new_collection": true,
    "total_blooms": 5,
    "garden_slots": 7,
    "slot_unlocked": true
  }
}
```

**`NOT_READY` 응답 예**
```json
{ "ok": false, "error": { "code": "NOT_READY", "message": "조금만 더 기다려 주세요", "remaining_hours": 0.4 } }
```

**비고 — ⏸ 결정 대기 (개화 후 식물 처리)**: 개화 후 칸을 비울지, 같은 종 재개화 보상이 있는지는 게임 규칙서 확정 후 이 함수에 반영한다.

---

### 3.10 `get-daily-insight`

구독자에게 오늘의 심층 해석을 준다. 하루 한 번 생성하고 이후엔 저장된 것을 돌려준다.

**요청**: `{}`

**처리**
1. `NOT_ONBOARDED` 확인
2. 구독 확인: `subscriptions`에 `status = 'active' and expires_at > now()` 행이 있는지
3. **구독자가 아니면** AI를 호출하지 않고 `locked: true`와 미리보기 문구(오행별 고정 템플릿)만 반환한다. 에러가 아니다 — 화면은 블러와 구독 안내를 보여준다.
4. `daily_insights`에 오늘 행이 있으면 그대로 반환
5. 없으면 Gemini Flash 호출 (`GEMINI_API_KEY`), 입력: `ohang_type`, 오늘 `energy_code`
   - 응답은 JSON 스키마로 강제하고 형식을 검증한다
   - **제한 시간 8초**. 실패·시간 초과·형식 오류면 템플릿 문구로 대체하고 `generated_by = 'fallback'`
6. `insert ... on conflict (user_id, insight_date) do nothing` 후 다시 조회해 반환 (동시 요청에도 AI 1회)

**응답 200 (구독자)**
```json
{
  "ok": true,
  "data": {
    "locked": false,
    "insight": {
      "insight_date": "2026-10-15",
      "relation_text": "…",
      "advice_cards": [
        { "topic": "일", "text": "…" },
        { "topic": "관계", "text": "…" },
        { "topic": "마음", "text": "…" }
      ],
      "recommended_mix": [ { "sound_id": "…", "volume": 0.7 } ],
      "generated_by": "ai"
    }
  }
}
```

**응답 200 (비구독자)**
```json
{ "ok": true, "data": { "locked": true, "preview_text": "…" } }
```

**AI 프롬프트 규칙**: 부정적 예언 금지, 단정 대신 은유와 위로의 표현, 400~600자. 상세 템플릿과 금지 표현은 콘텐츠 정의서에서 확정한다.

---

### 3.11 `generate-daily-energy` (예약 작업)

**인증**: `x-cron-secret`. **스케줄**: pg_cron `5 15 * * *` (UTC, = KST 00:05)

**요청**
```json
{ "date": "2026-10-16" }
```
`date`는 선택이다. 없으면 KST 오늘. 지난 날짜를 채워 넣을 때 쓴다.

**처리**
1. 에너지 코드 산출 — ⏸ 결정 대기 (사주 산출 규칙서: 일진의 천간/지지 기준). 확정 전까지는 KST 날짜 기준 5개 오행 균등 순환.
2. 요약 문구: Gemini Flash, 실패 시 오행별 대체 문구 (`generated_by = 'fallback'`)
3. `insert ... on conflict (energy_date, system_type) do nothing` — 이미 있으면 바꾸지 않는다

**응답 200**
```json
{ "ok": true, "data": { "energy_date": "2026-10-16", "energy_code": "fire", "generated_by": "ai", "created": true } }
```

---

### 3.12 `send-push` (예약 작업)

**인증**: `x-cron-secret`. **구현 단계**: 2-E

**요청**
```json
{ "type": "seed_reminder", "dry_run": false }
```

| `type` | 대상 | 스케줄 |
|---|---|---|
| `seed_reminder` | `seed_reminder_enabled`이고 `seed_reminder_time`이 현재 30분 구간에 속하며 오늘 씨앗을 안 받은 사용자 | 30분마다 |
| `watering_reminder` | `watering_reminder_enabled`이고 오늘 물을 안 준 미개화 식물이 있는 사용자 | 30분마다 (`watering_reminder_time` 기준) |
| `bloom` | `bloom_reminder_enabled`이고 진행률 100%가 된 식물이 있는 사용자 | 1시간마다 |

**처리**
1. 대상 조회 (잠든 정원은 제외)
2. 사용자별 **하루 2건 상한** — ⚠ 현재 발송 기록을 남길 테이블이 없다. `push_logs(user_id, type, sent_at)` 추가가 필요하다 (§4).
3. FCM HTTP v1 발송 (`FIREBASE_SERVICE_ACCOUNT_JSON`)
4. FCM이 "등록되지 않은 토큰"으로 응답하면 해당 `push_tokens` 행 삭제
5. `dry_run = true`면 발송 없이 대상 수만 반환

**응답 200**
```json
{ "ok": true, "data": { "type": "seed_reminder", "targeted": 120, "sent": 118, "failed": 2, "invalid_tokens_removed": 1 } }
```

알림 문구는 압박 없는 톤으로 쓴다 ("씨앗이 기다려요" O / "지금 안 하면 사라져요" X).

---

### 3.13 `verify-purchase`

**구현 단계**: 2-F. 결제·구독 정책서 확정 후 상세화한다. 여기서는 뼈대만 정한다.

| 경로 | 호출자 | 인증 |
|---|---|---|
| 결제 확인 | 앱·웹 결제 완료 직후 클라이언트 | 사용자 JWT |
| 웹훅 | Toss, Google Play(RTDN), App Store Server Notifications | 결제사 서명 검증 |

**공통 원칙**
- 구독 활성 여부는 **서버가 결제사에 직접 확인한 결과로만** 판단한다. 클라이언트가 보낸 "결제 성공"은 믿지 않는다.
- `provider_subscription_id`(또는 주문번호)로 중복 처리를 막는다.
- 구독이 활성화되거나 갱신되면 그달의 `premium_monthly` 씨앗을 지급한다 (`idx_user_seeds_premium_monthly`로 월 1회 보장).
- `subscriptions`는 이 함수만 쓴다.

**요청 (결제 확인)**
```json
{ "provider": "toss", "plan": "monthly", "payment_key": "…", "order_id": "…" }
```

**응답 200**
```json
{ "ok": true, "data": { "status": "active", "plan": "monthly", "expires_at": "2026-11-15T00:00:00Z", "premium_seed_granted": true } }
```

**에러**: `PAYMENT_NOT_VERIFIED` (402), `DUPLICATE_PURCHASE` (409)

---

### 3.14 `delete-account`

**요청**
```json
{ "confirm": "DELETE", "acknowledge_subscription": false }
```

**처리**
1. `confirm`이 `"DELETE"`가 아니면 `VALIDATION_ERROR`
2. 활성 구독이 있고 `acknowledge_subscription = false`면 `ACTIVE_SUBSCRIPTION` (409) — 스토어 구독은 앱스토어에서 따로 해지해야 한다는 안내를 위해
3. Storage에 사용자 파일이 있으면 삭제 (현재 없음 — 생기면 경로를 이 문서에 추가)
4. `auth.admin.deleteUser(user_id)` → `profiles`부터 모든 하위 테이블이 cascade로 삭제됨

**응답 200**
```json
{ "ok": true, "data": { "deleted": true } }
```

**비고 — ⏸ 결정 대기 (결제·구독 정책서)**: 지금 구조에서는 `subscriptions`도 함께 삭제된다. 전자상거래 관련 거래 기록을 일정 기간 보관해야 하는지 확인하고, 필요하면 결제 기록을 개인 식별 정보와 분리해 보관하는 방식으로 바꾼다.

---

## 4. 이 문서로 드러난 스키마 추가 사항

API를 정의하면서 현재 스키마(001~007)에 없는 것이 확인됐다. 008 이후 마이그레이션으로 반영한다.

| # | 추가 사항 | 필요한 함수 | 조건 |
|---|---|---|---|
| 1 | 다중 테이블 처리용 SQL 함수 6종 + 실행 권한 제한 (§1.7) | complete-onboarding 외 5종 | 항상 |
| 2 | `profiles.slept_at timestamptz` | touch-active, wake-garden | 잠듦 정책이 A안 또는 현행 동결일 때 |
| 3 | `push_logs (user_id, type, sent_at)` + `(user_id, sent_at)` 인덱스 | send-push | 하루 2건 상한 구현 시 |
| 4 | 결제 기록 보관 구조 | delete-account, verify-purchase | 결제·구독 정책서 결정 후 |

---

## 5. 클라이언트 연동 체크리스트

- [ ] `src/lib/api.ts`: 응답 형식(`{ ok, data | error }`)에 맞게 수정, `error`를 `{ code, message }`로 (§1.5)
- [ ] `src/lib/mappers.ts`: PlantDTO → `GardenPlant`, UserSeedDTO → `InventorySeed` 변환
- [ ] 정원 액션(심기·물주기·별빛)을 `VITE_USE_SERVER_GARDEN === 'true'`일 때 Edge Function 호출로 전환
- [ ] 별빛 탭 모아 보내기 (마지막 탭 후 1초 또는 팝오버 닫힐 때)
- [ ] 서버 응답의 `plant`로 스토어를 덮어써서 클라이언트·서버 값을 맞춤
- [ ] 에러 코드별 화면 처리 (에러케이스 정의서)

---

## 6. 결정 대기 요약

| 위치 | 결정 사항 | 관련 문서 |
|---|---|---|
| 3.1, 3.2, 3.11 | 오행 산출과 오늘의 에너지 규칙 | 사주 산출 규칙서 |
| 3.3, 3.4 | 잠듦 정책 A/B안, `slept_at` 컬럼 여부 | 게임 규칙서 |
| 3.6, 3.9 | 정원이 찼을 때, 개화 후 식물 처리, 같은 종 재개화 보상 | 게임 규칙서 |
| 3.13, 3.14 | 구독·환불·결제 기록 보관 | 결제·구독 정책서 |

---

## 변경 이력

| 버전 | 일자 | 내용 |
|---|---|---|
| v1.0 | 2026-10-15 | 최초 작성. 14종 요청·응답·검증·에러 정의, 다중 테이블 처리 SQL 함수 원칙, 스키마 추가 사항 4건 도출 |
