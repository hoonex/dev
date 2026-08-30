# Sideby

친구들과 같은 방에 머물며 **오늘 할 일, 공부/휴식 상태, 집중 시간**을 가볍게 공유하는 모바일 우선 공부 웹앱입니다.

## 제품 방향

- 방은 일회성이 아니라 계속 유지되는 친구 그룹입니다.
- 각 사용자는 오늘 할 일을 적고 자신의 상태를 `공부 중` / `쉬는 중`으로 바꿀 수 있습니다.
- 집중 타이머를 마치면 개인 집중 기록이 저장됩니다.
- 친구 순위나 압박성 지표 대신, 함께 자리해 있다는 감각과 개인 기록에 집중합니다.
- 모바일을 기본 화면으로 설계하고 데스크톱에서도 같은 정보 구조를 유지합니다.

## 기술 구조

이 첫 버전은 빌드 시스템 없이 배포 가능한 ESM 기반 정적 웹앱입니다.

- Frontend: HTML / CSS / JavaScript modules
- Auth + DB + Realtime: Supabase
- Hosting target: Vercel 또는 다른 정적 호스팅
- Tests: Node.js built-in test runner

React/Next.js 같은 프레임워크를 아직 강제하지 않은 이유는 초기 제품 구조와 상호작용을 빠르게 검증하기 위해서입니다. 데이터 모델과 Supabase API 경계는 분리되어 있어, 규모가 커지면 프론트엔드만 프레임워크로 이전할 수 있습니다.

## 현재 Supabase 상태

실제 `Sideby` Supabase 프로젝트가 연결되어 있습니다.

- Region: Seoul (`ap-northeast-2`)
- `config.js`: Project URL + Supabase publishable key 사용
- RLS: 모든 사용자 데이터 테이블에서 활성화
- Realtime: 방 멤버, 오늘 할 일, 공부 상태 구독
- RLS 내부 helper는 API에 노출되지 않는 `private` schema 사용

`config.js`의 publishable key는 브라우저 클라이언트에 포함하도록 설계된 공개 키입니다. `service_role` 같은 서버 전용 비밀 키는 저장소에 넣지 않습니다.

## 로컬 실행

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 엽니다.

실제 Supabase 설정을 일시적으로 제거하면 앱은 자동으로 로컬 미리보기 저장소를 사용할 수 있도록 데이터 계층이 분리되어 있습니다.

## Supabase migrations

새 환경을 재구성할 때 아래 순서대로 적용합니다.

1. `supabase/migrations/20260830130000_initial.sql`
2. `supabase/migrations/20260830132900_harden_rls_helpers.sql`
3. `supabase/migrations/20260830133000_optimize_rls_and_indexes.sql`

현재 운영 프로젝트에는 위와 동일한 변경이 이미 적용되어 있습니다.

## Auth

- Email magic link 코드 경계가 구현되어 있습니다.
- Google OAuth 코드 경계가 구현되어 있습니다.
- 실제 배포 후 Supabase Auth의 Site URL / Redirect URLs에 배포 주소를 등록해야 합니다.
- Google OAuth를 쓰려면 Supabase Auth에서 Google provider 설정도 추가해야 합니다.

## 검증

```bash
npm test
npm run check
```

## 주요 데이터

- `profiles`: 표시 이름
- `rooms`: 지속형 공부방과 6자리 초대 코드
- `room_members`: 방 멤버십
- `daily_tasks`: 날짜별 개인 할 일
- `study_status`: 방별 현재 공부/휴식 상태
- `focus_sessions`: 개인 집중 세션

모든 사용자 데이터 테이블에 RLS가 활성화됩니다. 방 생성/참가는 입력 검증과 `auth.uid()` 확인을 수행하는 제한된 `security definer` RPC로 처리하고, RLS 판정 helper는 `private` schema에 격리합니다.
