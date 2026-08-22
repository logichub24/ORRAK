# 오르락 (ORRAK)

Toss 인앱용 집중력 체크 앱 초안입니다. 60초 집중력 배터리와 결과 해석, 주간 기록, 그리고 `LH-AI` 연동 가능한 코칭 레이어를 포함합니다.

## 현재 포함된 기능

- 60초 3단계 집중력 배터리
  - 반응 속도
  - 선택적 주의
  - 지속 집중
- 결과 카드, 휴식 처방, 회고 피드백
- 주간 기록과 평균 비교
- 로컬 AI fallback
- `LH-AI` 브리지 또는 REST API 연동 준비

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 주요 문서

- [LH-AI 연동 메모](./docs/lh-ai-integration.md)
- [오픈소스 리서치 메모](./docs/open-source-research-notes.md)

## 디렉터리 구조

```text
src/
  components/
  data/
  hooks/
  lib/
  screens/
```
