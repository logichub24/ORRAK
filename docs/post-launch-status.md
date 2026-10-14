# 오르락(ORRAK) 출시 후 상태 메모

## 2026-07-11 KST 확인

- 현재 상태: 출시됨
- AIT 빌드: `npm.cmd run build` 통과
- 최신 AIT deploymentId: `019f4e70-36c3-7663-9795-c4592a7e1001`
- 웹 미리보기 빌드: `npm.cmd run build:web` 통과

## 광고

- 라이브 광고 ID 3종은 `src/config/launchConfig.js`에서 활성화됨
  - 배너: `ait.v2.live.a195cbf4d09d471f`
  - 전면: `ait.v2.live.93bf9f29910140f7`
  - 리워드: `ait.v2.live.7d2d0203c9dd4fdb`

## 방문자 확인

- 실제 방문자/유입 수는 Toss 운영 콘솔에서 확인 필요
- 앱 내부 QA용 로컬 분석은 `src/lib/analytics.js`에서 저장함
- 이번 점검에서 `app_open`, visitorId, sessionId, 세션별 중복 방지 로직을 추가함

## 다음 확인 항목

- Toss 콘솔에서 방문자 수, 실행 수, 오류 로그 확인
- Android 실기기에서 전면/리워드 광고 노출과 완료 후 화면 이동 확인
- 최신 업로드 대상은 루트의 `orrak.ait`
