# 오르락 출시 전 입력 항목

실제 광고 ID와 로고 링크가 나오면 아래 파일 한 곳만 수정하면 됩니다.

- 설정 파일: [src/config/launchConfig.js](D:\toss-app\오르락(ORRAK)\src\config\launchConfig.js)

## 1. 로고 링크 주소

`brand.logoUrl`

예시:

```js
brand: {
  appNameKo: "오르락",
  appNameEn: "Orrak",
  logoUrl: "https://example.com/orrak-logo.png",
}
```

## 2. 광고 ID 3종

### 배너 광고

`ads.banner`

```js
banner: {
  enabled: true,
  unitId: "BANNER_AD_UNIT_ID",
  placement: "home_record_bottom",
}
```

### 전면 광고

`ads.interstitial`

```js
interstitial: {
  enabled: true,
  unitId: "INTERSTITIAL_AD_UNIT_ID",
  placement: "before_result_entry",
}
```

### 리워드 광고

`ads.reward`

```js
reward: {
  enabled: true,
  unitId: "REWARD_AD_UNIT_ID",
  placement: "retry_and_deep_analysis",
}
```

## 3. 현재 광고 위치 기준

- 배너: 홈, 기록 하단
- 전면: 측정 종료 후 결과 진입 직전
- 리워드: 다시 측정, 심층 분석

## 4. 반영 후 체크리스트

1. `enabled`를 모두 `true`로 변경
2. ID 3종 입력
3. `npm.cmd run build`
4. 폰 실기기에서 광고 노출 확인
5. 다시 측정 / 심층 분석 보상 흐름 확인
