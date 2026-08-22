# LH-AI Integration Notes

## Supported connection modes

1. Browser bridge
   - `window.logicHubAIEngine`
   - `window.LogicHubAIEngine`
   - `window.LHAI`

2. REST endpoint
   - `VITE_LH_AI_ENDPOINT`
   - `VITE_LH_AI_API_KEY`

## Expected contract

The app sends:

```json
{
  "appId": "orrak",
  "appVersion": "0.2.0",
  "locale": "ko-KR",
  "method": "getSchedule",
  "input": {
    "tasks": "인강 30분, 메일 답장",
    "gradeLabel": "B"
  }
}
```

Recommended response shape:

```json
{
  "text": "사용자에게 바로 보여줄 답변"
}
```

Alternative supported fields:

- `message`
- `output`

## Methods used by the app

- `getTip`
- `getBooster`
- `getSchedule`
- `getSolution`
- `getKickstart`
- `getPersona`
- `getRest`
- `getRetro`
- `getWeeklyReport`

## Battery-aware payload examples

- `getPersona`
- `getRest`
- `getRetro`
- `getWeeklyReport`

These methods may include:

```json
{
  "context": {
    "batterySummary": {
      "strongestStageLabel": "반응 속도",
      "weakestStageLabel": "지속 집중",
      "avgReactionMs": 352
    },
    "stageResults": [
      {
        "id": "reaction",
        "title": "반응 속도",
        "score": 1320,
        "metricSummary": "평균 352ms / 적중 9회"
      }
    ]
  }
}
```

## Fallback policy

If LH-AI bridge or API is unavailable, the app automatically falls back to the bundled local engine so the user flow never blocks.
