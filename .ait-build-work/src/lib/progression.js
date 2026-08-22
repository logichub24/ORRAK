import { getToday } from "./date";
import { getPercentile, inferAgeGroupFromScore } from "./scoring";

const DAILY_TIPS = [
  "오후 2시는 집중력이 떨어지기 쉬운 시간입니다. 중요한 일은 그 전에 배치해보세요.",
  "카페인보다 물 한 잔이 더 효과적일 때가 있습니다. 측정 전 수분부터 채워보세요.",
  "알림 하나만 줄여도 선택적 주의 점수가 더 안정적으로 오를 수 있어요.",
  "연속 진행보다 25분 집중, 5분 휴식 리듬이 지속 집중에 더 유리합니다.",
  "측정 전 3번 깊게 호흡하면 반응 속도가 안정되고 실수가 줄어들 수 있어요.",
];

const PERSONAS = {
  reaction: {
    name: "스프린터 타입",
    summary: "첫 반응이 빠르고 타이밍 감각이 좋은 편입니다.",
  },
  focus: {
    name: "전략가 타입",
    summary: "방해 요소 속에서도 정답을 골라내는 힘이 좋습니다.",
  },
  flow: {
    name: "레이저 타입",
    summary: "흐름을 한 번 타면 길게 이어가는 지속 집중에 강점이 있습니다.",
  },
  balanced: {
    name: "창작자 타입",
    summary: "한 곳에 치우치지 않고 전반적으로 균형 잡힌 집중 흐름을 보입니다.",
  },
};

const TIME_SLOT_ORDER = [
  "오전 6~8시",
  "오전 8~10시",
  "오전 10~12시",
  "오후 1~3시",
  "오후 3~6시",
  "오후 7~9시",
  "밤 9시 이후",
];

const TIME_OF_DAY_TO_SLOT = {
  새벽: "오전 6~8시",
  아침: "오전 8~10시",
  오후: "오후 1~3시",
  저녁: "오후 7~9시",
};

function normalizeTimeSlot(record) {
  return record?.timeSlot || TIME_OF_DAY_TO_SLOT[record?.timeOfDay] || "오전 8~10시";
}

function classifyTimeSlotStatus(average, baseline) {
  if (!baseline) return "기준 수집 중";
  if (average >= baseline + 250) return "최고";
  if (average >= baseline + 50) return "양호";
  if (average <= baseline - 180) return "저하";
  return "회복";
}

function getRepresentativeAge(ageGroup) {
  const mapping = {
    "20대": 25,
    "30대": 35,
    "40대": 45,
    "50대": 55,
    "60대": 65,
  };

  return mapping[ageGroup] || 35;
}

export function getFocusLevel(totalMeasuredDays, allTimeBest, streak, totalPlays) {
  const xp =
    totalMeasuredDays * 18 +
    Math.floor((allTimeBest || 0) / 120) +
    Math.min(streak, 7) * 10 +
    totalPlays * 2;
  const level = Math.max(1, Math.floor(xp / 55) + 1);
  const previousLevelXp = (level - 1) * 55;
  const nextLevelXp = level * 55;
  const progressPct = Math.min(100, Math.max(0, Math.round(((xp - previousLevelXp) / 55) * 100)));

  let title = "산만한 참새";
  if (level >= 20) title = "마스터 브레인";
  else if (level >= 10) title = "집중 독수리";
  else if (level >= 5) title = "집중 토끼";

  return {
    xp,
    level,
    title,
    progressPct,
    nextLevelXp,
    previousLevelXp,
    remainingXp: Math.max(0, nextLevelXp - xp),
  };
}

export function getChallengeProgress(streak, target = 7) {
  return {
    current: Math.min(streak, target),
    target,
    completed: streak >= target,
    remaining: Math.max(0, target - streak),
  };
}

export function getDailyTip(dateString = getToday()) {
  const seed = dateString
    .split("-")
    .join("")
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
  return DAILY_TIPS[seed % DAILY_TIPS.length];
}

export function getFocusPersona(result) {
  const strongest = result?.batterySummary?.strongestStageId;
  const weakest = result?.batterySummary?.weakestStageId;

  if (!strongest || strongest === weakest) {
    return PERSONAS.balanced;
  }

  return PERSONAS[strongest] || PERSONAS.balanced;
}

export function getRankSnapshot(data, result, preferredAgeGroup) {
  const allScores = (data.records || []).map((record) => record.score);
  const allTimeBest = allScores.length ? Math.max(...allScores) : result?.score || 0;
  const weekScores = (data.records || []).slice(0, 7).map((record) => record.score);
  const weeklyBest = weekScores.length ? Math.max(...weekScores) : result?.score || 0;
  const ageGroup = preferredAgeGroup || inferAgeGroupFromScore(result?.score || 0);
  const percentile = getPercentile(result?.score || 0, ageGroup);

  return {
    ageGroup,
    percentile,
    topPercent: Math.max(1, 100 - percentile),
    allTimeBest,
    weeklyBest,
    measuredDays: (data.records || []).length,
  };
}

export function getBadgeCollection({ streak, measuredDays, allTimeBest, level, challengeCompleted }) {
  return [
    {
      id: "starter",
      label: "첫 측정",
      shortLabel: "시작",
      unlocked: measuredDays >= 1,
      description: "첫 집중 기록을 남긴 배지",
    },
    {
      id: "streak-3",
      label: "3일 연속",
      shortLabel: "3일",
      unlocked: streak >= 3,
      description: "3일 연속 측정 달성",
    },
    {
      id: "challenge-7",
      label: "7일 챌린지",
      shortLabel: "7일",
      unlocked: challengeCompleted || streak >= 7,
      description: "7일 연속 측정 달성",
    },
    {
      id: "score-3000",
      label: "3000점 돌파",
      shortLabel: "3000",
      unlocked: allTimeBest >= 3000,
      description: "고점수 구간 진입",
    },
    {
      id: "score-4500",
      label: "에이스 흐름",
      shortLabel: "에이스",
      unlocked: allTimeBest >= 4500,
      description: "S 등급 구간 도달",
    },
    {
      id: "level-10",
      label: "Lv.10 도달",
      shortLabel: "Lv10",
      unlocked: level >= 10,
      description: "집중 독수리 구간 도달",
    },
  ];
}

export function getTimePattern(records = []) {
  if (!records.length) {
    return {
      bestTimeOfDay: "데이터 수집 중",
      weakestTimeOfDay: "데이터 수집 중",
      bestAverage: 0,
    };
  }

  const groups = records.reduce((acc, record) => {
    const key = record.timeOfDay || "기타";
    if (!acc[key]) acc[key] = [];
    acc[key].push(record.score);
    return acc;
  }, {});

  const averages = Object.entries(groups).map(([timeOfDay, scores]) => ({
    timeOfDay,
    average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
  }));

  averages.sort((a, b) => b.average - a.average);

  return {
    bestTimeOfDay: averages[0]?.timeOfDay || "데이터 수집 중",
    weakestTimeOfDay: averages[averages.length - 1]?.timeOfDay || "데이터 수집 중",
    bestAverage: averages[0]?.average || 0,
  };
}

export function getTimeSlotAnalysis(records = []) {
  if (!records.length) {
    return {
      slots: TIME_SLOT_ORDER.slice(1, 5).map((label) => ({
        label,
        average: 0,
        count: 0,
        status: "기준 수집 중",
      })),
      bestSlot: "데이터 수집 중",
      weakestSlot: "데이터 수집 중",
      profileLabel: "패턴 수집 단계",
      summary: "3일 이상 기록이 쌓이면 가장 강한 시간대가 보이기 시작합니다.",
    };
  }

  const groups = records.reduce((acc, record) => {
    const key = normalizeTimeSlot(record);
    if (!acc[key]) acc[key] = [];
    acc[key].push(record.score);
    return acc;
  }, {});

  const allScores = records.map((record) => record.score);
  const baseline = allScores.length ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0;
  const slots = TIME_SLOT_ORDER.filter((label) => groups[label]).map((label) => {
    const scores = groups[label];
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    return {
      label,
      average,
      count: scores.length,
      status: classifyTimeSlotStatus(average, baseline),
    };
  });

  slots.sort((a, b) => TIME_SLOT_ORDER.indexOf(a.label) - TIME_SLOT_ORDER.indexOf(b.label));
  const sortedByScore = [...slots].sort((a, b) => b.average - a.average);
  const bestSlot = sortedByScore[0]?.label || "데이터 수집 중";
  const weakestSlot = sortedByScore[sortedByScore.length - 1]?.label || "데이터 수집 중";
  const isMorning = bestSlot.includes("오전");
  const isEvening = bestSlot.includes("오후 7~9시") || bestSlot.includes("밤");
  const profileLabel = bestSlot === "데이터 수집 중" ? "패턴 수집 단계" : isMorning ? "오전형 집중자" : isEvening ? "회복형 야간 집중자" : "오후형 집중자";

  return {
    slots,
    bestSlot,
    weakestSlot,
    profileLabel,
    summary:
      bestSlot === "데이터 수집 중"
        ? "기록이 조금 더 쌓이면 시간대별 집중 흐름을 정확하게 볼 수 있어요."
        : `${bestSlot} 구간의 평균 점수가 가장 높습니다. 중요한 일은 이 시간대에 배치해보세요.`,
  };
}

export function getTodayPrescription(result) {
  if (!result) {
    return {
      title: "중요한 일 시작 전에 먼저 체크하세요",
      doNow: "공부나 업무 시작 전 60초 측정으로 오늘 컨디션을 먼저 확인해보세요.",
      avoidNow: "상태 확인 없이 무리하게 깊은 작업부터 시작하지 마세요.",
      recheck: "첫 측정 기록이 쌓일수록 나만의 패턴이 더 선명해집니다.",
    };
  }

  const weakStage = result?.batterySummary?.weakestStageId;

  if (result.score < 1800) {
    return {
      title: "오늘은 회복 중심으로 가는 편이 좋습니다",
      doNow: "짧은 정리 업무나 가벼운 루틴부터 처리하고, 물 한 잔과 10분 환기를 추천합니다.",
      avoidNow: "바로 깊은 작업이나 긴 몰입 세션으로 들어가는 건 피해주세요.",
      recheck: "휴식 후 다시 측정하면 회복 효과가 얼마나 있는지 바로 확인할 수 있어요.",
    };
  }

  if (weakStage === "reaction") {
    return {
      title: "빠른 판단보다 준비 시간을 짧게 갖는 편이 유리합니다",
      doNow: "메일 정리, 빠른 응답, 바로 시작 가능한 일부터 처리해보세요.",
      avoidNow: "반응 속도가 중요한 급한 결정은 잠깐 템포를 늦추는 편이 좋습니다.",
      recheck: "30초 준비 후 다시 측정하면 반응 구간 변화가 잘 드러납니다.",
    };
  }

  if (weakStage === "focus") {
    return {
      title: "오늘은 환경 정리가 성과를 크게 바꿉니다",
      doNow: "알림을 끄고 한 가지 작업만 띄운 상태에서 25분 집중을 시작해보세요.",
      avoidNow: "메신저, 쇼츠, 짧은 영상 확인이 지금 흐름을 가장 쉽게 깨뜨립니다.",
      recheck: "방해 요소를 줄인 뒤 다시 측정하면 선택적 주의 변화가 더 선명해집니다.",
    };
  }

  if (weakStage === "flow") {
    return {
      title: "짧은 몰입 세션을 여러 번 이어가는 방식이 맞습니다",
      doNow: "25분 집중, 5분 휴식 리듬으로 오늘 중요한 일 하나를 먼저 끝내보세요.",
      avoidNow: "오랜 시간 버티겠다는 생각으로 시작하면 초반 흐름이 무너지기 쉽습니다.",
      recheck: "한 세션을 마친 뒤 재측정하면 지속 집중 회복 여부를 바로 볼 수 있습니다.",
    };
  }

  return {
    title: "지금은 중요한 일을 밀어붙이기 좋은 구간입니다",
    doNow: "가장 가치 큰 작업 한 가지를 바로 시작해보세요.",
    avoidNow: "집중이 좋은 시간에 사소한 일로 에너지를 먼저 쓰지 마세요.",
    recheck: "한 번의 집중 세션 뒤 다시 측정하면 오늘 리듬 변화가 더 잘 보입니다.",
  };
}

export function getRevisitReason({ isTodayDone, streak, challenge, patternSnapshot }) {
  if (!isTodayDone) {
    return "오늘 기록이 아직 없어 연속 측정 흐름이 끊길 수 있어요.";
  }

  if (!challenge.completed && challenge.remaining > 0) {
    return `${challenge.remaining}일만 더 측정하면 7일 챌린지에 도달합니다.`;
  }

  if (patternSnapshot?.bestTimeOfDay && patternSnapshot.bestTimeOfDay !== "데이터 수집 중") {
    return `${patternSnapshot.bestTimeOfDay} 시간대가 가장 강합니다. 내일도 같은 시간에 확인해보세요.`;
  }

  if (streak >= 7) {
    return "지금의 연속 기록을 유지할수록 내 패턴 분석이 더 정확해집니다.";
  }

  return "내일 같은 시간에 다시 측정하면 변화 흐름을 더 선명하게 볼 수 있어요.";
}

export function getRecommendedMeasurementTime(records = []) {
  const slotAnalysis = getTimeSlotAnalysis(records);

  if (slotAnalysis.bestSlot !== "데이터 수집 중") {
    return {
      label: slotAnalysis.profileLabel,
      window: slotAnalysis.bestSlot,
      reason: `${slotAnalysis.bestSlot} 구간 평균이 가장 높았습니다.`,
    };
  }

  return {
    label: "첫 패턴 만들기",
    window: "중요한 일 시작 전 1회",
    reason: "3일만 기록해도 나에게 맞는 시간대가 보이기 시작합니다.",
  };
}

export function getPredictiveAlert({ records = [], isTodayDone, todayResult, recommendedTime, challenge }) {
  const slotAnalysis = getTimeSlotAnalysis(records);

  if (!isTodayDone) {
    return {
      title: "오늘 자정 전 1회만 남겨두세요",
      body: `${recommendedTime.window} 측정 1회만 있어도 시간대 추천 정확도가 더 올라갑니다.`,
    };
  }

  if (todayResult?.score < 1800) {
    return {
      title: "회복 후 재확인 추천",
      body: "물 한 잔, 3분 환기 뒤 다시 측정하면 회복 흐름을 비교하기 좋습니다.",
    };
  }

  if (!challenge.completed) {
    return {
      title: `챌린지 유지 알림`,
      body: `내일 ${slotAnalysis.bestSlot}에 확인하면 ${challenge.remaining}일 남은 챌린지를 이어가기 좋습니다.`,
    };
  }

  return {
    title: "다음 추천 확인 시간",
    body:
      slotAnalysis.bestSlot !== "데이터 수집 중"
        ? `${slotAnalysis.bestSlot} 구간이 가장 강합니다. 같은 시간에 다시 보면 변화가 더 선명합니다.`
        : "내일 같은 시간에 다시 측정하면 흐름 비교가 더 정확해집니다.",
  };
}

export function getDailyBrief({ isTodayDone, diffFromYesterday, rankSnapshot, challenge, predictiveAlert }) {
  if (!isTodayDone) {
    return {
      headline: "오늘 기록이 아직 비어 있습니다",
      summary: "중요한 일 시작 전 60초만 투자하면 오늘 해야 할 일과 피해야 할 일을 바로 확인할 수 있어요.",
      footer: predictiveAlert.body,
    };
  }

  const diffText =
    diffFromYesterday === null
      ? "비교 기록을 쌓는 중입니다."
      : diffFromYesterday >= 0
        ? `어제보다 ${Math.abs(diffFromYesterday).toLocaleString()}점 상승했습니다.`
        : `어제보다 ${Math.abs(diffFromYesterday).toLocaleString()}점 하락했습니다.`;

  return {
    headline: diffText,
    summary: rankSnapshot
      ? `현재 상위 ${rankSnapshot.topPercent}% 흐름입니다. 이 리듬을 유지하면 개인화 추천이 더 정확해집니다.`
      : "오늘 측정 결과를 바탕으로 개인화 추천이 갱신됩니다.",
    footer: challenge.completed
      ? predictiveAlert.body
      : `${challenge.remaining}일만 더 이어가면 7일 챌린지입니다. ${predictiveAlert.body}`,
  };
}

export function getNextChallengeMilestone(streak = 0) {
  const milestones = [3, 7, 14, 30];
  const next = milestones.find((milestone) => streak < milestone) || milestones[milestones.length - 1];
  return {
    next,
    remaining: Math.max(0, next - streak),
    completedAll: streak >= milestones[milestones.length - 1],
  };
}

export function getTodayGoal({ isTodayDone, streak, patternSnapshot, recommendedTime }) {
  if (!isTodayDone) {
    return {
      badge: "오늘 목표",
      title: "오늘 기록 1회 남기기",
      body: recommendedTime?.window
        ? `${recommendedTime.window}에 60초 측정을 해두면 내 패턴 분석이 더 정확해집니다.`
        : "중요한 일 시작 전에 60초 측정으로 오늘 컨디션을 먼저 확인해보세요.",
    };
  }

  if (streak > 0 && streak < 7) {
    const milestone = getNextChallengeMilestone(streak);
    return {
      badge: "챌린지 목표",
      title: `${milestone.next}일 챌린지까지 ${milestone.remaining}일`,
      body: "내일도 같은 시간에 측정해서 연속 기록과 패턴 데이터를 함께 쌓아보세요.",
    };
  }

  if (patternSnapshot?.bestTimeOfDay && patternSnapshot.bestTimeOfDay !== "데이터 수집 중") {
    return {
      badge: "패턴 목표",
      title: `${patternSnapshot.bestTimeOfDay} 루틴 유지하기`,
      body: `${patternSnapshot.bestTimeOfDay} 시간대 기록이 가장 좋습니다. 내일도 같은 흐름을 재현해보세요.`,
    };
  }

  return {
    badge: "유지 목표",
    title: "오늘 리듬 저장하기",
    body: "한 번 더 돌아와 기록을 확인하면 내 집중 패턴이 더 선명해집니다.",
  };
}

export function getPatternForecast(records = []) {
  if (!records.length) {
    return {
      profile: "패턴 수집 단계",
      summary: "아직 기록이 적어 예측이 어렵습니다. 3일만 기록해도 시간대와 강점이 보이기 시작합니다.",
      risk: "기록 부족",
      opportunity: "첫 루틴 만들기",
    };
  }

  const timePattern = getTimePattern(records);
  const stageCounts = records.reduce(
    (acc, record) => {
      const strongest = record?.batterySummary?.strongestStageId;
      const weakest = record?.batterySummary?.weakestStageId;
      if (strongest) acc.strong[strongest] = (acc.strong[strongest] || 0) + 1;
      if (weakest) acc.weak[weakest] = (acc.weak[weakest] || 0) + 1;
      return acc;
    },
    { strong: {}, weak: {} }
  );

  const bestStage = Object.entries(stageCounts.strong).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const weakStage = Object.entries(stageCounts.weak).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const stageNames = {
    reaction: "빠른 시작형",
    focus: "정답 선별형",
    flow: "깊은 몰입형",
  };

  const weakNames = {
    reaction: "시작 직전 준비 부족",
    focus: "환경 잡음 영향",
    flow: "지속 체력 저하",
  };

  return {
    profile: stageNames[bestStage] || "균형형",
    summary:
      timePattern.bestTimeOfDay !== "데이터 수집 중"
        ? `${timePattern.bestTimeOfDay} 시간대에 가장 강하고, ${stageNames[bestStage] || "균형형"} 흐름을 보입니다.`
        : "기록이 쌓이는 중이며 전반적인 흐름을 만들고 있습니다.",
    risk: weakNames[weakStage] || "데이터 수집 중",
    opportunity:
      timePattern.bestTimeOfDay !== "데이터 수집 중"
      ? `${timePattern.bestTimeOfDay} 루틴 재현`
      : "3일 연속 기록 만들기",
  };
}

export function getTaskRecommendation(result) {
  if (!result) {
    return {
      title: "오늘 할 일은 가볍게 정리하는 것부터 시작하세요",
      recommended: ["이메일 처리", "문서 정리", "짧은 자료 조사"],
      discouraged: ["깊은 코딩", "장시간 학습", "무거운 기획서 작성"],
    };
  }

  const weakStage = result?.batterySummary?.weakestStageId;

  if (result.score >= 3200) {
    return {
      title: "오늘은 깊게 생각하는 일이 잘 맞습니다",
      recommended: ["기획서 작성", "코딩 집중 작업", "설계/분석 업무"],
      discouraged: ["단순 반복 정리", "짧은 알림 확인 반복", "소모성 잡무만 처리"],
    };
  }

  if (weakStage === "reaction") {
    return {
      title: "빠른 판단이 필요한 일보다 준비가 있는 일이 맞습니다",
      recommended: ["이메일 처리", "문서 정리", "자료 조사"],
      discouraged: ["즉답이 필요한 회신", "급한 승인 결정", "순간 반응 게임형 작업"],
    };
  }

  if (weakStage === "focus") {
    return {
      title: "방해가 적은 단일 업무에 집중하는 편이 좋습니다",
      recommended: ["문서 검토", "정리 작업", "단일 주제 조사"],
      discouraged: ["멀티태스킹", "메신저 병행 업무", "회의 중 병렬 작업"],
    };
  }

  if (weakStage === "flow") {
    return {
      title: "짧게 끝나는 업무부터 처리하면 리듬을 만들기 쉽습니다",
      recommended: ["이메일 처리", "회의 준비", "자료 조사"],
      discouraged: ["기획서 작성", "장시간 코딩", "긴 학습 세션"],
    };
  }

  return {
    title: "균형 잡힌 상태라 우선순위 높은 일을 먼저 처리하기 좋습니다",
    recommended: ["핵심 업무 1개", "중요 문서 작성", "분석/정리 업무"],
    discouraged: ["사소한 잡무부터 처리", "의미 없는 반복 확인", "산만한 멀티태스킹"],
  };
}

export function getFocusAge(score, preferredAgeGroup = "30대") {
  const focusAgeGroup = inferAgeGroupFromScore(score || 0);
  const actualAge = getRepresentativeAge(preferredAgeGroup);
  const focusAge = Math.max(22, Math.min(65, Math.round(66 - ((score || 0) / 5000) * 42)));
  const delta = actualAge - focusAge;

  return {
    actualAge,
    actualAgeGroup: preferredAgeGroup,
    focusAge,
    focusAgeGroup,
    delta,
    summary:
      delta >= 0
        ? `오늘은 실제보다 ${delta}살 어린 집중 흐름입니다.`
        : `오늘은 실제보다 ${Math.abs(delta)}살 더 피로한 흐름입니다.`,
  };
}

export function getRecoveryPrescription(result) {
  if (!result) {
    return {
      status: "측정 전 준비 단계",
      steps: ["물 한 잔 마시기", "3회 깊은 호흡", "측정 후 바로 오늘 상태 확인"],
      summary: "짧은 준비만으로도 첫 측정의 안정감이 좋아질 수 있습니다.",
    };
  }

  const weakStage = result?.batterySummary?.weakestStageId;

  if (result.score < 1800) {
    return {
      status: "전반적인 피로 신호",
      steps: ["물 한 잔 마시기", "3분 산책", "5회 심호흡"],
      summary: "회복 루틴 후 다시 측정하면 컨디션 회복 여부를 바로 확인할 수 있어요.",
    };
  }

  if (weakStage === "reaction") {
    return {
      status: "반응 속도 저하",
      steps: ["자리 정돈 1분", "어깨/목 풀기", "10초 준비 후 시작"],
      summary: "급하게 바로 시작하기보다 짧은 준비 루틴이 효과적입니다.",
    };
  }

  if (weakStage === "focus") {
    return {
      status: "선택적 주의 저하",
      steps: ["알림 끄기", "한 화면만 남기기", "이어폰 또는 귀마개 착용"],
      summary: "주변 자극을 줄이면 오늘 성과가 가장 크게 달라질 수 있습니다.",
    };
  }

  return {
    status: "지속 집중 저하",
    steps: ["물 한 잔", "3분 환기", "25분 집중 / 5분 휴식 시작"],
    summary: "짧은 몰입 세션으로 흐름을 여러 번 이어가는 편이 좋습니다.",
  };
}

export function getWorkStyleRecommendation(result) {
  const persona = getFocusPersona(result);

  const map = {
    "전략가 타입": {
      type: "전략가 타입",
      recommended: ["분석", "설계", "기획"],
      discouraged: ["반복 잡무", "알림 대응", "산만한 멀티태스킹"],
    },
    "레이저 타입": {
      type: "레이저 타입",
      recommended: ["코딩", "문서 작성", "장시간 집중 작업"],
      discouraged: ["잦은 회의", "짧은 전환 반복", "메신저 대응"],
    },
    "스프린터 타입": {
      type: "스프린터 타입",
      recommended: ["이메일 답변", "빠른 정리", "즉시 처리 업무"],
      discouraged: ["긴 기획", "오랜 학습", "복잡한 초안 작성"],
    },
    "창작자 타입": {
      type: "창작자 타입",
      recommended: ["브레인스토밍", "아이디어 정리", "균형형 작업"],
      discouraged: ["의미 없는 반복 작업", "자잘한 방해가 많은 일", "과도한 동시 진행"],
    },
  };

  return map[persona.name] || map["창작자 타입"];
}

export function getFocusRiskAlert(records = []) {
  if (records.length < 3) {
    return {
      level: "info",
      title: "위험 신호를 분석하는 중입니다",
      body: "3일 이상 기록이 쌓이면 최근 하락 흐름과 피로 신호를 볼 수 있어요.",
    };
  }

  const latest = records.slice(0, 3).map((record) => record.score);
  const isDeclining = latest[0] < latest[1] && latest[1] < latest[2];
  const latestAvg = Math.round(latest.reduce((sum, score) => sum + score, 0) / latest.length);
  const previous = records.slice(3, 6).map((record) => record.score);
  const previousAvg = previous.length ? Math.round(previous.reduce((sum, score) => sum + score, 0) / previous.length) : latestAvg;
  const drop = previousAvg - latestAvg;

  if (isDeclining || drop >= 250) {
    return {
      level: "warn",
      title: "최근 3일 연속 하락 흐름입니다",
      body: "집중력 저하 신호가 보여요. 수면, 피로, 작업 밀도를 먼저 점검해보세요.",
    };
  }

  return {
    level: "good",
    title: "최근 흐름이 안정적입니다",
    body: "현재 패턴을 유지하면 시간대 분석과 업무 추천 정확도가 더 높아집니다.",
  };
}

export function getWeeklyAiSummary(records = []) {
  if (!records.length) {
    return {
      bestMoment: "기록 수집 중",
      average: 0,
      strength: "데이터 수집 중",
      weakness: "데이터 수집 중",
    };
  }

  const week = records.slice(0, 7);
  const average = Math.round(week.reduce((sum, record) => sum + record.score, 0) / week.length);
  const bestRecord = week.reduce((best, record) => (best.score > record.score ? best : record));
  const stageCounts = buildStageCountMap(week);

  return {
    bestMoment: `${bestRecord.date} ${normalizeTimeSlot(bestRecord)}`,
    average,
    strength: stageCounts.best,
    weakness: stageCounts.weakest,
  };
}

function buildStageCountMap(records = []) {
  const stageNames = {
    reaction: "반응 속도",
    focus: "선택적 주의",
    flow: "지속 집중",
  };
  const counts = { strong: {}, weak: {} };
  records.forEach((record) => {
    const strong = record?.batterySummary?.strongestStageId;
    const weak = record?.batterySummary?.weakestStageId;
    if (strong) counts.strong[strong] = (counts.strong[strong] || 0) + 1;
    if (weak) counts.weak[weak] = (counts.weak[weak] || 0) + 1;
  });

  const best = Object.entries(counts.strong).sort((a, b) => b[1] - a[1])[0]?.[0];
  const weakest = Object.entries(counts.weak).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    best: stageNames[best] || "데이터 수집 중",
    weakest: stageNames[weakest] || "데이터 수집 중",
  };
}

export function getFocusRoutine(result, records = []) {
  const recommendedTime = getRecommendedMeasurementTime(records);

  if (!result) {
    return {
      title: "첫 루틴 만들기",
      steps: [
        `${recommendedTime.window} 오르락 측정`,
        "25분 집중 시작",
        "5분 휴식",
        "끝난 뒤 기록 확인",
      ],
    };
  }

  if (result.score < 1800) {
    return {
      title: "회복형 루틴",
      steps: ["물 한 잔", "3분 산책", "10분 뒤 재측정", "짧은 정리 업무 시작"],
    };
  }

  return {
    title: "집중형 루틴",
    steps: [`${recommendedTime.window} 측정`, "25분 집중", "5분 휴식", "25분 집중"],
  };
}

export function getFocusGrowth(records = []) {
  const recent = records.slice(0, 7);
  const previous = records.slice(7, 14);

  if (!recent.length) {
    return {
      recentAvg: 0,
      previousAvg: 0,
      changePct: 0,
      summary: "성장 흐름을 계산할 기록이 아직 부족합니다.",
    };
  }

  const recentAvg = Math.round(recent.reduce((sum, record) => sum + record.score, 0) / recent.length);
  const previousAvg = previous.length
    ? Math.round(previous.reduce((sum, record) => sum + record.score, 0) / previous.length)
    : 0;
  const changePct = previousAvg ? Math.round(((recentAvg / previousAvg) - 1) * 100) : 0;

  return {
    recentAvg,
    previousAvg,
    changePct,
    summary: previousAvg
      ? `지난 구간 대비 ${changePct >= 0 ? `${changePct}% 상승` : `${Math.abs(changePct)}% 하락`}했습니다.`
      : "지난 구간 비교는 아직 어렵지만, 첫 성장 구간이 쌓이는 중입니다.",
  };
}

export function getTaskPriorityRecommendation(rawTasks, result) {
  const tasks = String(rawTasks || "")
    .split(/\n|,/)
    .map((task) => task.trim())
    .filter(Boolean);

  if (!tasks.length) {
    return {
      ordered: [],
      summary: "할 일을 적으면 현재 집중 흐름에 맞춘 우선순위를 바로 정리해드릴 수 있어요.",
    };
  }

  const workStyle = getWorkStyleRecommendation(result);
  const weakStage = result?.batterySummary?.weakestStageId;

  const classify = (task) => {
    const lower = task.toLowerCase();
    if (/(메일|이메일|답변|reply|message)/.test(lower)) return "quick";
    if (/(보고서|기획|설계|전략|proposal|plan)/.test(lower)) return "strategy";
    if (/(코딩|개발|coding|debug|구현)/.test(lower)) return "deep";
    if (/(정리|청소|정돈|업로드|분류)/.test(lower)) return "organize";
    if (/(회의|미팅|발표|준비)/.test(lower)) return "prepare";
    if (/(공부|학습|독서|인강|lecture)/.test(lower)) return "study";
    return "general";
  };

  const scoreMap = {
    quick: 2,
    strategy: 2,
    deep: 2,
    organize: 2,
    prepare: 2,
    study: 2,
    general: 2,
  };

  if (result?.score >= 3200 || workStyle.type === "전략가 타입" || workStyle.type === "레이저 타입") {
    scoreMap.strategy += 3;
    scoreMap.deep += 3;
    scoreMap.prepare += 2;
  } else if (weakStage === "flow") {
    scoreMap.quick += 3;
    scoreMap.organize += 3;
    scoreMap.prepare += 2;
    scoreMap.deep -= 2;
    scoreMap.study -= 2;
    scoreMap.strategy -= 1;
  } else if (weakStage === "focus") {
    scoreMap.organize += 3;
    scoreMap.strategy += 2;
    scoreMap.quick += 1;
  } else {
    scoreMap.quick += 2;
    scoreMap.prepare += 2;
    scoreMap.organize += 1;
  }

  const ordered = tasks
    .map((task) => {
      const type = classify(task);
      return {
        task,
        type,
        weight: scoreMap[type] || 2,
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .map((item, index) => ({
      rank: index + 1,
      task: item.task,
      reason:
        item.type === "strategy" || item.type === "deep"
          ? "지금은 깊게 생각하는 일을 먼저 잡는 편이 좋습니다."
          : item.type === "quick" || item.type === "organize"
            ? "짧게 끝나는 일부터 처리하면 리듬을 만들기 쉽습니다."
            : "현재 흐름에서 무리 없이 이어갈 수 있는 작업입니다.",
    }));

  return {
    ordered,
    summary: `현재 집중력 기준으로 ${ordered[0]?.task}부터 시작하는 편이 가장 효율적입니다.`,
  };
}

export function getCoachRecommendation(result) {
  const weakStage = result?.batterySummary?.weakestStageId;

  if (!result) {
    return {
      tab: "mood",
      label: "컨디션 코칭",
      title: "측정 전 컨디션부터 점검해보세요",
      body: "지금 상태를 짧게 적으면 오늘 흐름에 맞는 집중 코칭을 받을 수 있습니다.",
    };
  }

  if (result.score < 1800) {
    return {
      tab: "tip",
      label: "5분 팁",
      title: "회복 루틴부터 가볍게 시작하세요",
      body: "짧은 회복 팁과 재측정 타이밍을 먼저 확인하는 편이 유리합니다.",
    };
  }

  if (weakStage === "reaction") {
    return {
      tab: "mood",
      label: "컨디션 코칭",
      title: "반응 구간을 먼저 안정화해보세요",
      body: "지금 컨디션에 맞는 호흡과 준비 루틴을 받아 빠른 시작을 도와드립니다.",
    };
  }

  if (weakStage === "focus") {
    return {
      tab: "distraction",
      label: "방해 차단",
      title: "집중을 깨는 요소부터 줄이는 게 효과적입니다",
      body: "알림, 소음, 스마트폰 같은 방해 요소를 바로 줄일 수 있는 조치를 받아보세요.",
    };
  }

  if (weakStage === "flow") {
    return {
      tab: "schedule",
      label: "할 일 쪼개기",
      title: "짧은 몰입 세션 계획으로 성과를 올려보세요",
      body: "오늘 할 일을 25분 단위로 쪼개면 지속 집중을 더 오래 유지하기 좋습니다.",
    };
  }

  return {
    tab: "kickstart",
    label: "미루기 극복",
    title: "바로 움직일 수 있는 첫 행동부터 받아보세요",
    body: "오늘 가장 중요한 일을 시작하게 해주는 첫 단추를 정리해드립니다.",
  };
}

export function getPriorityAction(result) {
  const coach = getCoachRecommendation(result);

  if (!result) {
    return {
      title: "오늘 첫 측정으로 기준선을 만들어두세요",
      body: "중요한 일 시작 전 60초만 투자해도 오늘 컨디션과 집중 전략이 달라집니다.",
      ctaLabel: "지금 측정하러 가기",
      recommendedTab: "mood",
      recommendedCoachLabel: coach.label,
    };
  }

  return {
    title: coach.title,
    body: coach.body,
    ctaLabel: `${coach.label} 바로 열기`,
    recommendedTab: coach.tab,
    recommendedCoachLabel: coach.label,
  };
}

export function getSkipCostMessage({ isTodayDone, streak, challenge, recommendedTime }) {
  if (!isTodayDone) {
    return {
      title: "오늘 기록을 놓치면 패턴 분석이 약해집니다",
      body: `${recommendedTime.window} 측정 한 번만 남겨도 내 시간대 패턴이 더 정확해집니다.`,
    };
  }

  if (!challenge.completed) {
    return {
      title: "오늘 흐름을 놓치면 챌린지 리듬이 약해집니다",
      body: `${challenge.remaining}일만 더 이어가면 7일 챌린지에 도달합니다.`,
    };
  }

  return {
    title: "오늘 기록이 비면 내일 비교가 흐려집니다",
    body: "같은 시간대 기록이 이어질수록 컨디션 변화와 강한 구간이 더 또렷해집니다.",
  };
}
