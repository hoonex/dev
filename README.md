# ONE

하루 한 질문에 한 단어만 남기는 실시간 익명 공간입니다.

- 로그인 없음
- KST 기준 하루 한 질문
- 기기별 하루 한 답, 같은 기기에서는 수정 가능
- 같은 단어가 많을수록 더 크게 보이는 움직이는 word field
- 새 답변은 ghost flash로 잠깐 크게 나타남
- 화면 터치 ripple을 현재 접속자들과 Supabase Realtime Broadcast로 공유
- 현재 접속자 수는 Realtime Presence로 표시
- Supabase 원본 테이블 직접 접근 차단, 제한된 SECURITY DEFINER RPC로만 읽기/쓰기

## Verification

- `node --check app.js` 통과
- 운영 Supabase migration 적용 완료
- 실제 DB에서 오늘 질문 조회 → `온기` 제출 → 집계 조회까지 확인 후 테스트 데이터 삭제

## Deploy

정적 사이트이므로 Netlify에서 build command 없이 repository root를 publish하면 됩니다.
