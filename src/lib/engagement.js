import {
  getCoachRecommendation,
  getFocusAge,
  getFocusPersona,
  getTaskRecommendation,
  getTimeSlotAnalysis,
  getWorkStyleRecommendation,
} from "./progression";

export function getPredictionAccuracy(measuredDays = 0) {
  if (measuredDays >= 30) return { label: "매우 높음", percent: 92 };
  if (measuredDays >= 21) return { label: "높음", percent: 82 };
  if (measuredDays >= 14) return { label: "안정권 진입", percent: 72 };
  if (measuredDays >= 7) return { label: "개인화 시작", percent: 61 };
  if (measuredDays >= 3) return { label: "학습 중", percent: 48 };
  return { label: "기록 수집 중", percent: 32 };
}

export function getAssetStatus({ measuredDays = 0, streak = 0, challenge, levelInfo, records = [] }) {
  const accuracy = getPredictionAccuracy(measuredDays);
  const slotAnalysis = getTimeSlotAnalysis(records);
  const assetScore = Math.min(
    100,
    Math.round(
      measuredDays * 3 +
        Math.min(streak, 14) * 2 +
        (challenge?.completed ? 12 : challenge?.current || 0) +
        (levelInfo?.level || 1) * 2
    )
  );

  let moat = "아직은 시작 단계예요. 오늘 기록 한 번이 가장 큰 차이를 만듭니다.";
  if (assetScore >= 80) {
    moat = "이미 꽤 단단한 개인 데이터 자산을 쌓고 있어요. 패턴 추천 신뢰도가 높은 상태예요.";
  } else if (assetScore >= 60) {
    moat = "내 리듬이 분명하게 잡히고 있어요. 계속 쌓을수록 시간대 추천이 더 정확해집니다.";
  } else if (assetScore >= 40) {
    moat = "패턴이 보이기 시작했어요. 이번 주 기록만 더 이어도 추천 정확도가 크게 올라갑니다.";
  }

  return {
    assetScore,
    accuracy,
    moat,
    bestSlot: slotAnalysis.bestSlot,
    nextUnlock:
      measuredDays < 7
        ? "7일 기록"
        : measuredDays < 14
          ? "2주 패턴"
          : measuredDays < 30
            ? "30일 자산"
            : "고급 패턴 추천",
  };
}

export function getRetestPlan(result, records = []) {
  const slotAnalysis = getTimeSlotAnalysis(records);

  if (!result) {
    return {
      label: "오늘 첫 기록 만들기",
      summary: "첫 측정 기록만 있어도 내일부터 비교 분석과 시간대 추천이 바로 시작됩니다.",
    };
  }

  if (result.score < 1800) {
    return {
      label: "15분 후 재확인",
      summary: "물 한 잔과 3분 걷기 뒤 다시 확인하면 회복 전후 차이를 더 선명하게 볼 수 있어요.",
    };
  }

  if (result?.batterySummary?.weakestStageId === "flow") {
    return {
      label: "한 세션 뒤 재확인",
      summary: "25분 집중 1회 뒤 다시 측정하면 지속 집중 회복 여부를 확인하기 좋습니다.",
    };
  }

  return {
    label: `${slotAnalysis.bestSlot} 다시 확인`,
    summary:
      slotAnalysis.bestSlot && slotAnalysis.bestSlot !== "데이터 수집 중"
        ? `${slotAnalysis.bestSlot} 구간에 다시 확인하면 오늘의 최고 리듬을 재현하기 좋습니다.`
        : "내일 같은 시간에 다시 확인하면 컨디션 변화를 더 정확하게 비교할 수 있습니다.",
  };
}

export function getSharePersonaSummary(result, preferredAgeGroup = "30대", records = []) {
  const persona = getFocusPersona(result);
  const workStyle = getWorkStyleRecommendation(result);
  const focusAge = getFocusAge(result?.score || 0, preferredAgeGroup);
  const slotAnalysis = getTimeSlotAnalysis(records);

  return {
    title: `${persona.name} · ${workStyle.type}`,
    body: `${focusAge.focusAge}세 집중 리듬 · 강한 시간 ${slotAnalysis.bestSlot}`,
  };
}

export function getHomeDecisionBundle(result, records = [], preferredAgeGroup = "30대") {
  const coach = getCoachRecommendation(result);
  const tasks = getTaskRecommendation(result);
  const focusAge = getFocusAge(result?.score || 0, preferredAgeGroup);
  const workStyle = getWorkStyleRecommendation(result);
  const slotAnalysis = getTimeSlotAnalysis(records);

  return {
    firstActionTitle: coach.title,
    firstActionBody: coach.body,
    recommendedCoach: coach.label,
    recommendedTasks: tasks.recommended.slice(0, 2),
    discouragedTasks: tasks.discouraged.slice(0, 2),
    focusAge: `${focusAge.focusAge}세`,
    workStyle: workStyle.type,
    bestSlot: slotAnalysis.bestSlot,
  };
}

export function getDailyTheme(date = new Date()) {
  const themes = [
    {
      badge: "오늘의 테마",
      title: "짧고 선명하게 끝내는 날",
      body: "길게 버티기보다 25분 단위로 분명한 성과를 만드는 흐름이 잘 맞습니다.",
    },
    {
      badge: "오늘의 테마",
      title: "정리와 회복이 성과를 만드는 날",
      body: "답답한 일을 미는 것보다 정리, 메일, 구조화처럼 가벼운 진입이 더 효율적입니다.",
    },
    {
      badge: "오늘의 테마",
      title: "집중 한 번이 크게 남는 날",
      body: "중요한 일 하나를 먼저 잡고 짧게 몰입하면 오늘 전체 리듬이 더 좋아집니다.",
    },
    {
      badge: "오늘의 테마",
      title: "방해를 줄일수록 차이가 나는 날",
      body: "알림과 주변 자극만 줄여도 체감 집중도가 확실히 올라갈 가능성이 큽니다.",
    },
    {
      badge: "오늘의 테마",
      title: "리듬 유지가 가장 중요한 날",
      body: "완벽한 성과보다 흐름을 끊지 않는 것이 내일의 집중 정확도를 더 올려줍니다.",
    },
  ];

  const index = (date.getFullYear() + date.getMonth() + date.getDate()) % themes.length;
  return themes[index];
}

export function getCollectionProgress(badges = []) {
  const total = badges.length;
  const unlocked = badges.filter((badge) => badge.unlocked).length;
  const nextBadge = badges.find((badge) => !badge.unlocked) || null;
  const percent = total ? Math.round((unlocked / total) * 100) : 0;

  return {
    total,
    unlocked,
    remaining: Math.max(total - unlocked, 0),
    percent,
    nextBadge,
  };
}
