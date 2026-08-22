export const MEASURE_STAGES = [
  {
    id: "reaction",
    title: "\uBC18\uC751 \uC18D\uB3C4",
    shortLabel: "\uBC18\uC751",
    duration: 18,
    maxScore: 1600,
    accent: "cyan",
  },
  {
    id: "focus",
    title: "\uC120\uD0DD\uC801 \uC8FC\uC758",
    shortLabel: "\uC8FC\uC758",
    duration: 18,
    maxScore: 1600,
    accent: "orange",
  },
  {
    id: "flow",
    title: "\uC9C0\uC18D \uC9D1\uC911",
    shortLabel: "\uBAB0\uC785",
    duration: 24,
    maxScore: 2600,
    accent: "emerald",
  },
];

export function getStageMeta(stageId) {
  return MEASURE_STAGES.find((stage) => stage.id === stageId) || MEASURE_STAGES[0];
}

export function summarizeStageMetric(stageResult) {
  if (!stageResult) return "";

  if (stageResult.id === "reaction") {
    const avg = stageResult.metrics.avgReactionMs;
    return `\uD3C9\uADE0 ${avg ? `${avg}ms` : "-"} / \uC131\uACF5 ${stageResult.metrics.hits}\uD68C`;
  }

  if (stageResult.id === "focus") {
    return `\uC815\uB2F5 ${stageResult.metrics.correct} / \uC624\uB2F5 ${stageResult.metrics.wrong}`;
  }

  if (stageResult.id === "flow") {
    return `\uB0D9\uD558 ${stageResult.metrics.falls}\uD68C / \uCD5C\uACE0 ${stageResult.metrics.peakScore}`;
  }

  return "";
}

function getStageAccuracy(stageResult) {
  if (!stageResult) return 0;

  if (stageResult.id === "reaction") {
    const totalAttempts =
      stageResult.metrics.hits + stageResult.metrics.misses + stageResult.metrics.falseStarts;
    return totalAttempts ? stageResult.metrics.hits / totalAttempts : 0;
  }

  if (stageResult.id === "focus") {
    const totalAttempts = stageResult.metrics.correct + stageResult.metrics.wrong;
    return totalAttempts ? stageResult.metrics.correct / totalAttempts : 0;
  }

  if (stageResult.id === "flow") {
    return Math.max(0, 1 - stageResult.metrics.falls / 4);
  }

  return 0;
}

function getStageStrengthScore(stageResult) {
  const meta = getStageMeta(stageResult.id);
  const normalizedScore = meta.maxScore ? stageResult.score / meta.maxScore : 0;
  const accuracy = getStageAccuracy(stageResult);
  return normalizedScore * 0.7 + accuracy * 0.3;
}

export function finalizeBatteryResults(stageResults) {
  const totalScore = stageResults.reduce((sum, stage) => sum + stage.score, 0);
  const duration = stageResults.reduce((sum, stage) => sum + stage.duration, 0);
  const totalMistakes = stageResults.reduce((sum, stage) => {
    if (stage.id === "reaction") {
      return sum + stage.metrics.misses + stage.metrics.falseStarts;
    }
    if (stage.id === "focus") {
      return sum + stage.metrics.wrong;
    }
    if (stage.id === "flow") {
      return sum + stage.metrics.falls;
    }
    return sum;
  }, 0);

  const sorted = [...stageResults].sort((a, b) => getStageStrengthScore(b) - getStageStrengthScore(a));
  const strongestStage = sorted[0];
  const weakestStage = sorted[sorted.length - 1];
  const reactionStage = stageResults.find((stage) => stage.id === "reaction");
  const focusStage = stageResults.find((stage) => stage.id === "focus");
  const flowStage = stageResults.find((stage) => stage.id === "flow");

  return {
    score: totalScore,
    duration,
    falls: totalMistakes,
    stageResults,
    batterySummary: {
      strongestStageId: strongestStage?.id || null,
      strongestStageLabel: strongestStage?.title || "",
      weakestStageId: weakestStage?.id || null,
      weakestStageLabel: weakestStage?.title || "",
      avgReactionMs: reactionStage?.metrics.avgReactionMs || null,
      focusAccuracy: focusStage ? getStageAccuracy(focusStage) : null,
      flowFalls: flowStage?.metrics.falls ?? null,
    },
  };
}

export function buildResultContext(result) {
  return {
    score: result.score,
    falls: result.falls,
    batterySummary: result.batterySummary || null,
    stageResults: (result.stageResults || []).map((stage) => ({
      id: stage.id,
      title: stage.title,
      score: stage.score,
      duration: stage.duration,
      metricSummary: summarizeStageMetric(stage),
      metrics: stage.metrics,
    })),
  };
}

export function buildWeeklyContext(records) {
  const valid = records.filter(Boolean);
  const stageTotals = {
    reaction: 0,
    focus: 0,
    flow: 0,
  };
  const stageCounts = {
    reaction: 0,
    focus: 0,
    flow: 0,
  };

  valid.forEach((record) => {
    (record.stageResults || []).forEach((stage) => {
      stageTotals[stage.id] += stage.score;
      stageCounts[stage.id] += 1;
    });
  });

  const stageAverages = Object.entries(stageTotals).map(([id, score]) => ({
    id,
    average: stageCounts[id] ? Math.round(score / stageCounts[id]) : 0,
  }));

  stageAverages.sort((a, b) => b.average - a.average);

  return {
    recordCount: valid.length,
    bestStageId: stageAverages[0]?.id || null,
    weakestStageId: stageAverages[stageAverages.length - 1]?.id || null,
  };
}
