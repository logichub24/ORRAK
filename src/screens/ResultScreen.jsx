import React, { useEffect, useState } from "react";
import {
  ArrowUp,
  Coffee,
  Home,
  MessageSquareText,
  Share,
  Sparkles,
  Video,
} from "lucide-react";
import { buildResultContext, summarizeStageMetric } from "../lib/measureBattery";
import {
  getCoachRecommendation,
  getCognitiveConditionReport,
  getFocusAge,
  getFocusPersona,
  getMomentumSnapshot,
  getPriorityAction,
  getRecoveryPrescription,
  getRevisitReason,
  getTaskRecommendation,
  getTimeSlotAnalysis,
  getTodayPrescription,
  getWorkStyleRecommendation,
} from "../lib/progression";
import { getRetestPlan, getSharePersonaSummary } from "../lib/engagement";
import { SoundManager } from "../lib/soundManager";
import { getAgeComparison, getGrade, getInterpretation } from "../lib/scoring";
import { grantResultPromotionReward } from "../lib/promotionReward";

function SegmentTabs({ value, onChange, items }) {
  return (
    <div
      className={`mb-3 grid w-full gap-2 rounded-2xl bg-slate-100 p-1.5 ${
        items.length === 4 ? "grid-cols-4" : "grid-cols-3"
      }`}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => {
            SoundManager.playTab();
            onChange(item.value);
          }}
          className={`rounded-xl px-3 py-2.5 text-[13px] font-black transition-all ${
            value === item.value ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SectionCard({ eyebrow, title, badge, tone = "white", children }) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-200 bg-cyan-50"
      : tone === "blue"
        ? "border-blue-200 bg-blue-50"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white";

  return (
    <section className={`rounded-[1.6rem] border px-4 py-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold tracking-[0.2em] text-cyan-700">{eyebrow}</div>
          <div className="mt-2 text-[1.02rem] font-black leading-tight text-slate-950">{title}</div>
        </div>
        {badge ? (
          <div className="shrink-0 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-black text-blue-700">
            {badge}
          </div>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MetricChip({ label, value, tone = "default" }) {
  const toneClass =
    tone === "accent"
      ? "border-cyan-200 bg-cyan-50 text-cyan-800"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="text-[10px] font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-[13px] font-black">{value}</div>
    </div>
  );
}

function InsightPanel({ title, tone, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className={`text-[11px] font-extrabold tracking-[0.2em] ${tone}`}>{title}</div>
      <div className="reading-flow mt-2 whitespace-pre-wrap text-[13px] font-semibold leading-relaxed text-slate-700">
        {value}
      </div>
    </div>
  );
}

function buildHighlightLine({ achievements, momentum, revisitReason }) {
  if (achievements?.isNewAllTimeBest) return "개인 최고 기록이에요";
  if (achievements?.isNewWeeklyBest) return "이번 주 최고 기록이에요";
  if (achievements?.didLevelUp) return `Lv.${achievements.newLevel}로 상승했어요`;
  if (momentum?.isBestIn7) return "최근 7일 중 가장 좋은 흐름이에요";
  return revisitReason;
}

export function ResultScreen({
  result,
  onHome,
  onRetry,
  onCoach,
  engine,
  preferredAgeGroup = "30대",
  dataService,
  insightsUnlocked,
  onUnlockInsights,
}) {
  const grade = getGrade(result.score);
  const interpretation = getInterpretation(result.score);
  const ageCompare = getAgeComparison(result.score, preferredAgeGroup);
  const resultContext = buildResultContext(result);
  const persona = getFocusPersona(result);
  const prescription = getTodayPrescription(result);
  const cognitiveReport = getCognitiveConditionReport(result, dataService.data.records || []);
  const coachRecommendation = getCoachRecommendation(result);
  const priorityAction = getPriorityAction(result);
  const focusAge = getFocusAge(result.score, preferredAgeGroup);
  const recovery = getRecoveryPrescription(result);
  const workStyle = getWorkStyleRecommendation(result);
  const taskRecommendation = getTaskRecommendation(result);
  const timeSlotAnalysis = getTimeSlotAnalysis(dataService.data.records || []);
  const momentum = getMomentumSnapshot(dataService.data.records || [], preferredAgeGroup);
  const retestPlan = getRetestPlan(result, dataService.data.records || []);
  const revisitReason = getRevisitReason({
    isTodayDone: true,
    streak: dataService.streak,
    challenge: dataService.challenge,
    patternSnapshot: dataService.stats,
  });
  const sharePersona = getSharePersonaSummary(result, preferredAgeGroup, dataService.data.records || []);
  const achievements = result.achievements || {};

  const [copyMsg, setCopyMsg] = useState("");
  const [segment, setSegment] = useState("summary");
  const [insightTab, setInsightTab] = useState("persona");
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiRest, setAiRest] = useState(null);
  const [aiRetro, setAiRetro] = useState(null);
  const [reflection, setReflection] = useState("");
  const [loadingKey, setLoadingKey] = useState(null);

  useEffect(() => {
    SoundManager.playSuccess();
  }, []);

  useEffect(() => {
    grantResultPromotionReward(result);
  }, [result]);

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const highlightLine = buildHighlightLine({ achievements, momentum, revisitReason });

  const runAction = async (key, action) => {
    SoundManager.playAI();
    setLoadingKey(key);
    try {
      await action();
      SoundManager.playSuccess();
    } finally {
      setLoadingKey(null);
    }
  };

  const flashMessage = (message) => {
    setCopyMsg(message);
    window.setTimeout(() => setCopyMsg(""), 2200);
  };

  const handleShare = async () => {
    SoundManager.playClick();

    const text = [
      "오늘 오르락 집중력 측정 완료",
      `등급 ${grade.label} / ${result.score.toLocaleString()}점`,
      interpretation,
      `오늘의 인지 상태: ${cognitiveReport.gradeLabel} ${cognitiveReport.statusLabel}`,
      `집중 페르소나: ${persona.name}`,
      `추천 업무: ${cognitiveReport.suitableTasks.join(", ")}`,
      `집중력 나이: ${focusAge.focusAge}세`,
      `공유 한 줄: ${sharePersona.title}`,
      "#오르락 #집중력체크",
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "오르락 결과", text });
        return;
      } catch {
        // fallback
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      flashMessage("공유 문구를 복사했어요.");
    } catch {
      flashMessage("공유 문구 복사에 실패했어요.");
    }
  };

  const handleSaveResultImage = async () => {
    SoundManager.playClick();

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1280;
      const ctx = canvas.getContext("2d");

      const roundRect = (x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      const bg = ctx.createLinearGradient(0, 0, 1080, 1280);
      bg.addColorStop(0, "#eff6ff");
      bg.addColorStop(0.55, "#ecfeff");
      bg.addColorStop(1, "#ffffff");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1280);

      ctx.fillStyle = "#0f172a";
      ctx.font = "900 72px sans-serif";
      ctx.fillText("오르락", 90, 130);
      ctx.fillStyle = "#2563eb";
      ctx.font = "800 30px sans-serif";
      ctx.fillText("오늘의 집중 리포트", 92, 180);

      roundRect(80, 240, 920, 320, 40);
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.fill();
      ctx.strokeStyle = "rgba(14,165,233,0.18)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = grade.color;
      ctx.font = "900 128px sans-serif";
      ctx.fillText(grade.label, 130, 390);
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 86px sans-serif";
      ctx.fillText(result.score.toLocaleString(), 300, 390);
      ctx.fillStyle = "#0891b2";
      ctx.font = "800 30px sans-serif";
      ctx.fillText("집중력 지수", 304, 435);

      ctx.fillStyle = "#1e293b";
      ctx.font = "800 34px sans-serif";
      ctx.fillText(`${cognitiveReport.gradeLabel} ${cognitiveReport.statusLabel}`, 130, 500);
      ctx.font = "700 28px sans-serif";
      ctx.fillText(`집중력 나이 ${focusAge.focusAge}세 · 상위 ${ageCompare.betterThan}%`, 130, 540);

      roundRect(80, 610, 920, 190, 32);
      ctx.fillStyle = "#ecfeff";
      ctx.fill();
      ctx.strokeStyle = "#bae6fd";
      ctx.stroke();
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 32px sans-serif";
      ctx.fillText("오늘의 인지 상태", 120, 680);
      ctx.font = "700 28px sans-serif";
      ctx.fillText(cognitiveReport.averageLine, 120, 728);
      ctx.fillText(cognitiveReport.suitableTasks.join(" · "), 120, 772);

      roundRect(80, 840, 920, 250, 32);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.stroke();
      ctx.fillStyle = "#0891b2";
      ctx.font = "900 28px sans-serif";
      ctx.fillText("공유 한 줄", 120, 900);
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 42px sans-serif";
      ctx.fillText(sharePersona.title, 120, 965);
      ctx.font = "700 27px sans-serif";
      ctx.fillText(sharePersona.body, 120, 1015);
      ctx.fillText(`추천 코치: ${coachRecommendation.label}`, 120, 1060);

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `orrak-result-${Date.now()}.png`;
      link.click();
      flashMessage("이미지를 저장했어요.");
    } catch {
      flashMessage("이미지 저장을 다시 시도해 주세요.");
    }
  };

  return (
    <div className="scrollbar-none flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-slate-50 px-4 pb-4 pt-4 text-slate-900">
      {copyMsg ? (
        <div className="fixed left-1/2 top-6 z-[90] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-black text-white shadow-lg">
          {copyMsg}
        </div>
      ) : null}

      <section className="rounded-[1.7rem] border border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
        <div className="flex items-center justify-center text-[13px] font-black text-slate-400">
          <ArrowUp className="mr-1 h-4 w-4" strokeWidth={3} />
          오르락
        </div>
        <div className="mb-2 text-[13px] font-bold text-slate-500">{todayStr}</div>
        <div className="text-[46px] font-black leading-none" style={{ color: grade.color }}>
          {grade.label}
        </div>
        <div className="mt-1 text-[31px] font-black tracking-tight text-slate-950">{result.score.toLocaleString()}</div>
        <div className="mt-1 text-[13px] font-extrabold text-cyan-600">집중력 지수</div>

        <div className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
          {`오늘의 인지 상태 · ${cognitiveReport.gradeLabel} ${cognitiveReport.statusLabel}`}
        </div>

        <div className="reading-flow mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12px] font-extrabold leading-relaxed text-slate-800">
          {interpretation}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <MetricChip label="연령대 비교" value={`상위 ${ageCompare.betterThan}%`} tone="accent" />
          <MetricChip label="측정 시간" value={`${result.duration}초`} />
          <MetricChip
            label="실수 합계"
            value={`${result.falls}회`}
            tone={result.falls >= 5 ? "danger" : "default"}
          />
        </div>
      </section>

      <SegmentTabs
        value={segment}
        onChange={setSegment}
        items={[
          { value: "summary", label: "요약" },
          { value: "status", label: "상태" },
          { value: "action", label: "실행" },
          { value: "analysis", label: "분석" },
        ]}
      />

      <div className="space-y-3">
        {segment === "summary" ? (
          <>
            <SectionCard eyebrow="TODAY SUMMARY" title={highlightLine} badge={momentum.rankLine} tone="cyan">
              <div className="reading-flow text-[13px] font-semibold leading-relaxed text-slate-700">
                {momentum.weekRecordLine}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MetricChip label="최근 흐름" value={momentum.trendLine} tone="accent" />
                <MetricChip label="집중력 나이" value={momentum.focusAgeLine} />
              </div>
              <div className="mt-3 rounded-xl border border-cyan-200 bg-white/85 px-3 py-2.5 text-[12px] font-semibold leading-relaxed text-slate-700">
                {momentum.monthLine}
              </div>
            </SectionCard>

            <SectionCard eyebrow="STAGE RESULT" title="이번 측정 세부 점수">
              <div className="grid gap-2">
                {(result.stageResults || []).map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-black text-slate-900">{stage.title}</div>
                      <div className="reading-flow mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
                        {summarizeStageMetric(stage)}
                      </div>
                    </div>
                    <div className="ml-3 shrink-0 text-[14px] font-black text-cyan-600">
                      {stage.score.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="KEEP GOING" title="내일 다시 확인해야 하는 이유" badge={retestPlan.label}>
              <div className="reading-flow text-[13px] font-semibold leading-relaxed text-slate-700">
                {revisitReason}
              </div>
              <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[12px] font-semibold leading-relaxed text-slate-700">
                {retestPlan.summary}
              </div>
            </SectionCard>
          </>
        ) : null}

        {segment === "status" ? (
          <>
            <SectionCard
              eyebrow="TODAY CONDITION"
              title="오늘의 인지 상태"
              badge={`${cognitiveReport.gradeLabel} ${cognitiveReport.statusLabel}`}
              tone="blue"
            >
              <div className="rounded-xl border border-blue-200 bg-white px-3 py-3">
                <div className="text-[10px] font-black text-blue-700">최근 평균 대비</div>
                <div className="mt-1 text-[15px] font-black text-slate-950">{cognitiveReport.averageLine}</div>
              </div>
              <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-3">
                <div className="text-[10px] font-black text-cyan-700">오늘 추천 업무</div>
                <div className="reading-flow mt-1 text-[13px] font-black leading-relaxed text-slate-900">
                  {cognitiveReport.suitableTasks.join(" · ")}
                </div>
              </div>
              <div className="reading-flow mt-3 text-[13px] font-semibold leading-relaxed text-slate-700">
                {cognitiveReport.summary}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {cognitiveReport.stageHighlights.map((item) => (
                  <MetricChip
                    key={item.id}
                    label={item.label}
                    value={item.line.replace("최근 평균보다 ", "")}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="FOCUS PROFILE" title={workStyle.type} badge={`집중력 나이 ${focusAge.focusAge}세`}>
              <div className="grid grid-cols-3 gap-2">
                <MetricChip label="실제 나이 기준" value={`${focusAge.actualAge}세`} />
                <MetricChip label="집중력 나이" value={`${focusAge.focusAge}세`} tone="accent" />
                <MetricChip label="강한 시간" value={timeSlotAnalysis.bestSlot} />
              </div>
              <div className="reading-flow mt-3 text-[13px] font-semibold leading-relaxed text-slate-700">
                {focusAge.summary}
              </div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5">
                  <div className="text-[10px] font-black text-cyan-700">추천 업무</div>
                  <div className="reading-flow mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">
                    {taskRecommendation.recommended.join(" · ")}
                  </div>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                  <div className="text-[10px] font-black text-rose-700">비추천 업무</div>
                  <div className="reading-flow mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">
                    {taskRecommendation.discouraged.join(" · ")}
                  </div>
                </div>
              </div>
            </SectionCard>
          </>
        ) : null}

        {segment === "action" ? (
          <>
            <SectionCard eyebrow="TODAY ACTION" title={priorityAction.title} badge="지금 가장 먼저" tone="cyan">
              <div className="reading-flow text-[13px] font-semibold leading-relaxed text-slate-700">
                {priorityAction.body}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <MetricChip label="업무 유형" value={workStyle.type.replace(" 타입", "")} />
                <MetricChip label="추천 코치" value={coachRecommendation.label} tone="accent" />
                <MetricChip label="강한 시간" value={timeSlotAnalysis.bestSlot} />
              </div>
              <button
                type="button"
                onClick={() => {
                  SoundManager.playClick();
                  onCoach(priorityAction.recommendedTab);
                }}
                className="mt-3 flex w-full items-center justify-center rounded-xl bg-cyan-500 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-cyan-600"
              >
                {priorityAction.ctaLabel}
              </button>
              <div className="mt-3 rounded-xl border border-cyan-200 bg-white/85 px-3 py-2.5 text-[12px] font-semibold leading-relaxed text-slate-700">
                {prescription.doNow}
              </div>
            </SectionCard>

            <SectionCard eyebrow="RECOVERY PLAN" title={recovery.status}>
              <div className="grid gap-2">
                {recovery.steps.map((step) => (
                  <div
                    key={step}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-700"
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div className="reading-flow mt-3 text-[13px] font-semibold leading-relaxed text-slate-700">
                {recovery.summary}
              </div>
              <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-[12px] font-semibold leading-relaxed text-slate-700">
                {prescription.recheck}
              </div>
            </SectionCard>
          </>
        ) : null}

        {segment === "analysis" ? (
          <>
            <SectionCard eyebrow="SHARE SNAPSHOT" title="공유와 심층 분석을 한 곳에 모았습니다">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-3">
                <div className="text-[10px] font-black text-cyan-700">공유 한 줄</div>
                <div className="mt-1 text-[14px] font-black text-slate-900">{sharePersona.title}</div>
                <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">
                  {sharePersona.body}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MetricChip label="집중 페르소나" value={persona.name} tone="accent" />
                <MetricChip label="오늘 업무 타입" value={workStyle.type} />
              </div>
            </SectionCard>

            {!insightsUnlocked ? (
              <SectionCard eyebrow="DEEP ANALYSIS" title="심층 분석 열기" tone="rose">
                <div className="reading-flow text-[13px] font-semibold leading-relaxed text-slate-700">
                  광고를 보고 동물 페르소나, 휴식 처방, 오늘 회고 피드백까지 이어서 받아보세요.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    SoundManager.playClick();
                    onUnlockInsights();
                  }}
                  className="mt-3 flex w-full items-center justify-center rounded-xl bg-rose-500 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-rose-600"
                >
                  <Video className="mr-1.5 h-4.5 w-4.5" />
                  광고 보고 심층 분석 열기
                </button>
              </SectionCard>
            ) : (
              <SectionCard eyebrow="DEEP ANALYSIS" title="심층 분석">
                <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
                  {[
                    ["persona", "페르소나"],
                    ["rest", "휴식 처방"],
                    ["retro", "오늘 회고"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        SoundManager.playTab();
                        setInsightTab(key);
                      }}
                      className={`rounded-xl px-2 py-2 text-[11px] font-extrabold transition-all ${
                        insightTab === key ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {insightTab === "persona" && !aiFeedback ? (
                  <button
                    type="button"
                    onClick={() =>
                      runAction("persona", async () => {
                        const response = await engine.getPersona(result.score, result.falls, resultContext);
                        setAiFeedback(response);
                      })
                    }
                    className="flex w-full items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-extrabold text-cyan-700"
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    {loadingKey === "persona" ? "분석 중..." : "나의 집중 페르소나 보기"}
                  </button>
                ) : null}

                {insightTab === "persona" && aiFeedback ? (
                  <InsightPanel title="FOCUS PERSONA" tone="text-cyan-700" value={aiFeedback} />
                ) : null}

                {insightTab === "rest" && !aiRest ? (
                  <button
                    type="button"
                    onClick={() =>
                      runAction("rest", async () => {
                        const response = await engine.getRest(result.score, result.falls, resultContext);
                        setAiRest(response);
                      })
                    }
                    className="flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700"
                  >
                    <Coffee className="mr-1.5 h-4 w-4" />
                    {loadingKey === "rest" ? "분석 중..." : "맞춤 휴식 처방 보기"}
                  </button>
                ) : null}

                {insightTab === "rest" && aiRest ? (
                  <InsightPanel title="RECOVERY RX" tone="text-emerald-700" value={aiRest} />
                ) : null}

                {insightTab === "retro" && !aiRetro ? (
                  <div className="space-y-3">
                    <div className="reading-flow text-[13px] font-semibold leading-relaxed text-slate-600">
                      오늘 점수에 영향을 준 원인을 짧게 적어보세요.
                    </div>
                    <input
                      value={reflection}
                      onChange={(event) => setReflection(event.target.value)}
                      placeholder="예: 잠이 부족했고 오전 집중은 좋았음"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && reflection.trim()) {
                          event.preventDefault();
                          runAction("retro", async () => {
                            const response = await engine.getRetro(reflection, result.score, resultContext);
                            setAiRetro(response);
                            setReflection("");
                          });
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        runAction("retro", async () => {
                          const response = await engine.getRetro(reflection, result.score, resultContext);
                          setAiRetro(response);
                          setReflection("");
                        })
                      }
                      disabled={!reflection.trim() || loadingKey === "retro"}
                      className="flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-700 disabled:opacity-50"
                    >
                      <MessageSquareText className="mr-1.5 h-4 w-4" />
                      {loadingKey === "retro" ? "분석 중..." : "회고 피드백 받기"}
                    </button>
                  </div>
                ) : null}

                {insightTab === "retro" && aiRetro ? (
                  <InsightPanel title="TODAY RETRO" tone="text-blue-700" value={aiRetro} />
                ) : null}
              </SectionCard>
            )}

            <SectionCard eyebrow="QUICK ACTIONS" title="결과 화면에서 바로 이어가기">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center rounded-2xl bg-cyan-500 px-2 py-4 text-[13px] font-black text-white shadow-md transition-colors hover:bg-cyan-600"
                >
                  <Share className="mr-1.5 h-4.5 w-4.5" />
                  공유
                </button>
                <button
                  type="button"
                  onClick={handleSaveResultImage}
                  className="flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-2 py-4 text-[13px] font-black text-blue-700 shadow-sm transition-colors hover:bg-blue-100"
                >
                  이미지 저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    SoundManager.playClick();
                    onRetry();
                  }}
                  className="flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-2 py-4 text-[13px] font-black text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Video className="mr-1.5 h-4.5 w-4.5 text-rose-500" />
                  재측정
                </button>
                <button
                  type="button"
                  onClick={() => {
                    SoundManager.playClick();
                    onHome();
                  }}
                  className="flex items-center justify-center rounded-2xl bg-slate-100 px-2 py-4 text-[13px] font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-200"
                >
                  <Home className="mr-1.5 h-4.5 w-4.5" />
                  홈으로
                </button>
              </div>
            </SectionCard>
          </>
        ) : null}
      </div>
    </div>
  );
}
