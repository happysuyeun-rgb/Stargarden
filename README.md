# 별의 정원 (Stargarden)

오행 기질 기반 식물 키우기 + 프로시저럴 사운드 웹앱 (React 19 + Vite + TypeScript).

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 접속.

- **개발자 모드**: `npm run dev` 시 로그인 없이 정원 입장 (샘플 식물·도감 데이터 포함)
- **끄기**: `.env`에 `VITE_DEV_BYPASS_AUTH=false`
- Supabase 키 없이도 Zustand persist로 프론트 단독 동작

## 환경 변수

`.env.example`을 복사해 `.env` 작성:

| 변수 | 설명 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_DEV_BYPASS_AUTH` | `true`(기본) 시 개발자 모드 자동 활성 |

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | Oxlint |

## 주요 기능 (목업)

- **온보딩**: 생년월일·시진 12칸, 오행 기질 결과 (만세력 스텁)
- **정원**: 씨앗 심기·물주기·별빛·개화, 슬롯 확장, 30일 미접속 잠듦/깨어남
- **튜토리얼**: 웰컴 씨앗 → 심기 → 물주기 (SCR-004)
- **사운드**: Tone.js 믹서, 프리셋, 수면 타이머
- **도감**: 오행별 수집, 개화 연동

## 프로젝트 구조

```
src/
├── features/   auth, garden, sound, collection, my
├── stores/     Zustand (auth, garden, seeds, sound, collection, tutorial, toast)
├── lib/        growth, ohang, careActions, soundEngine, sleep, timeOfDay
├── constants/  seeds, game, strings
supabase/
├── migrations/ 001~008
└── functions/  Edge Function 스텁 14종 (전부 501 스텁)
```

## Supabase (Phase 2)

1. Supabase 프로젝트 생성
2. `supabase/migrations/001` ~ `008` 순서대로 실행
3. `.env`에 URL·anon key 설정
4. Google/Apple OAuth 콘솔 연동

**007·008은 Edge Function 구현 후 운영 DB에 적용할 것. 007은 클라이언트 쓰기를 막기 때문에, Edge Function 없이 적용하면 정원 데이터를 쓸 수 없음.**

## 문서

- [작업 현황 (2026-07-09)](docs/작업현황_2026-07-09.md)
- [설계 보완 v1.3.1](docs/설계보완_v1.3.1.md)
- [기획 보완 (2026-10-15)](docs/기획보완사항_2026-10-15.md)
- [게임 규칙서 v1.0](docs/게임규칙서_v1.0_2026-10-15.md)
- [API 명세서 v1.0](docs/API명세서_v1.0_2026-10-15.md)
- [에러케이스 정의서 v1.0](docs/에러케이스정의서_v1.0_2026-10-15.md)

## 기술 스택

React 19 · TypeScript · Vite · React Router · Zustand · Tone.js · Supabase JS
