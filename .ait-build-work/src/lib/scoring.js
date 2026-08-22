export const AGE_AVERAGES = {
  "\u0032\u0030\uB300": 3200,
  "\u0033\u0030\uB300": 2800,
  "\u0034\u0030\uB300": 2200,
  "\u0035\u0030\uB300": 1600,
  "\u0036\u0030\uB300": 1100,
};

export const GRADES = [
  { min: 4500, label: "S", name: "\uC9D1\uC911\uB825 \uCC9C\uC7AC", color: "#f59e0b", reaction: "\uB9E4\uC6B0 \uBE60\uB984" },
  { min: 3000, label: "A", name: "\uB192\uC740 \uC9D1\uC911\uB825", color: "#06b6d4", reaction: "\uBE60\uB984" },
  { min: 1500, label: "B", name: "\uD3C9\uADE0 \uC774\uC0C1", color: "#22c55e", reaction: "\uBCF4\uD1B5" },
  { min: 500, label: "C", name: "\uD3C9\uADE0 \uC218\uC900", color: "#f97316", reaction: "\uB290\uB9B0 \uD3B8" },
  { min: 0, label: "D", name: "\uC9D1\uC911\uB825 \uC800\uD558", color: "#9ca3af", reaction: "\uB290\uB9BC" },
];

export function getGrade(score) {
  return GRADES.find((grade) => score >= grade.min) || GRADES[GRADES.length - 1];
}

export function inferAgeGroupFromScore(score) {
  if (score > 3500) return "\u0032\u0030\uB300";
  if (score > 2500) return "\u0033\u0030\uB300";
  if (score > 1800) return "\u0034\u0030\uB300";
  if (score > 1200) return "\u0035\u0030\uB300";
  return "\u0036\u0030\uB300";
}

export function getPercentile(score, ageGroup) {
  const avg = AGE_AVERAGES[ageGroup] || AGE_AVERAGES["\u0033\u0030\uB300"];
  return Math.min(99, Math.max(1, Math.round((score / (avg * 1.8)) * 100)));
}

export function getInterpretation(score) {
  const grade = getGrade(score);
  const ageGroup = inferAgeGroupFromScore(score);
  const percentile = getPercentile(score, ageGroup);

  const messages = {
    S: `\uC624\uB298 \uC9D1\uC911\uB825\uC774 \uCD5C\uACE0\uC870\uC608\uC694. ${ageGroup} \uAE30\uC900 \uC0C1\uC704 ${percentile}% \uC218\uC900\uC785\uB2C8\uB2E4.`,
    A: `\uC9D1\uC911\uB825\uC774 \uB9E4\uC6B0 \uC88B\uC740 \uC0C1\uD0DC\uC608\uC694. ${ageGroup} \uD3C9\uADE0\uC744 \uD6E8\uC52C \uC6C3\uB3CC\uACE0 \uC788\uC5B4\uC694.`,
    B: `\uC624\uB298 \uC9D1\uC911\uB825\uC774 \uC548\uC815\uC801\uC778 \uD3B8\uC774\uC5D0\uC694. ${ageGroup} \uD3C9\uADE0 \uC774\uC0C1\uC73C\uB85C \uC720\uC9C0\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4.`,
    C: `\uC870\uAE08 \uD53C\uB85C\uD55C \uD750\uB984\uC774 \uBCF4\uC774\uC9C0\uB9CC ${ageGroup} \uD3C9\uADE0\uAD8C \uC548\uC5D0\uC11C \uC6C0\uC9C1\uC774\uACE0 \uC788\uC5B4\uC694.`,
    D: "\uC9D1\uC911\uB825\uC774 \uB9CE\uC774 \uB5A8\uC5B4\uC9C4 \uC0C1\uD0DC\uC608\uC694. \uC7A0\uAE50 \uC27C\uACE0 \uB2E4\uC2DC \uCE21\uC815\uD558\uBA74 \uB354 \uC815\uD655\uD55C \uD750\uB984\uC744 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  };

  return messages[grade.label];
}

export function getAgeComparison(score, selectedAgeGroup = "\u0033\u0030\uB300") {
  const avg = AGE_AVERAGES[selectedAgeGroup] || AGE_AVERAGES["\u0033\u0030\uB300"];
  const percentile = getPercentile(score, selectedAgeGroup);

  return {
    ageGroup: selectedAgeGroup,
    avg,
    percentile,
    betterThan: Math.max(1, 100 - percentile),
  };
}
