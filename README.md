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

## 로컬 미리보기

Supabase 설정이 없으면 자동으로 **미리보기 모드**가 열립니다. 로컬 데이터로 방, 할 일, 상태, 타이머와 통계 흐름을 확인할 수 있습니다.

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 엽니다.

## Supabase 연결

1. Supabase 프로젝트를 준비합니다.
2. SQL Editor 또는 Supabase CLI로 `supabase/migrations/20260830130000_initial.sql`을 적용합니다.
3. `config.example.js`를 `config.js`로 복사합니다.
4. Project URL과 publishable key를 입력합니다.
5. Supabase Auth에서 Google provider를 설정하거나 email magic link를 사용합니다.
6. Auth의 Site URL / Redirect URL에 실제 배포 주소를 등록합니다.

```bash
cp config.example.js config.js
```

`config.js`는 `.gitignore`에 포함되어 있어 키 값을 저장소에 커밋하지 않습니다. Supabase publishable key는 브라우저 공개용 키지만, 환경별 설정을 분리하기 위해 저장소에는 예시만 둡니다.

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

모든 사용자 데이터 테이블에 RLS가 활성화되며, 방 코드를 통한 참가/생성은 `security definer` RPC를 통해 처리합니다.
