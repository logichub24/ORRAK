import React, { useEffect, useState } from "react";
import { ArrowUp, Coffee, Home, MessageSquareText, Share, Sparkles, Trophy, Video } from "lucide-react";
import { buildResultContext, summarizeStageMetric } from "../lib/measureBattery";
import {
  getCoachRecommendation,
  getFocusAge,
  getFocusPersona,
  getFocusRoutine,
  getPriorityAction,
  getRecoveryPrescription,
  getRevisitReason,
  getTaskRecommendation,
  getTimeSlotAnalysis,
  getTimePattern,
  getTodayPrescription,
  getWorkStyleRecommendation,
} from "../lib/progression";
import { getAssetStatus, getRetestPlan, getSharePersonaSummary } from "../lib/engagement";
import { SoundManager } from "../lib/soundManager";
import { getAgeComparison, getGrade, getInterpretation } from "../lib/scoring";

function MetricBlock({ label, value }) {
  return (
    <div className="rounded-xl bg-white/70 px-2 py-2">
      <div className="text-[10px] font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xs font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function ScrollableInsight({ title, tone, value }) {
  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto whitespace-pre-wrap px-2 pb-1 text-[13px] font-semibold leading-relaxed text-slate-800">
      <span className={`mb-3 block text-sm font-black ${tone}`}>{title}</span>
      {value}
    </div>
  );
}

function AchievementCard({ title, body, tone = "cyan", pulse = false }) {
  const tones = {
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    amber: "border-cyan-200 bg-cyan-50 text-cyan-700",
    violet: "border-cyan-200 bg-cyan-50 text-cyan-700",
    emerald: "border-cyan-200 bg-cyan-50 text-cyan-700",
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${tones[tone]} ${pulse ? "animate-pulse" : ""}`}>
      <div className="text-[11px] font-extrabold tracking-[0.18em]">ACHIEVEMENT</div>
      <div className="mt-2 text-sm font-black text-slate-900">{title}</div>
      <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{body}</div>
    </div>
  );
}

function LevelUpBanner({ previousLevel, newLevel, title }) {
  return (
    <div className="mb-4 w-full max-w-sm overflow-hidden rounded-[1.8rem] border border-cyan-300 bg-gradient-to-r from-cyan-100 via-sky-50 to-cyan-100 px-5 py-5 shadow-lg">
      <div className="text-[11px] font-extrabold tracking-[0.2em] text-cyan-700">LEVEL UP</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-black text-slate-950">{`Lv.${previousLevel} → Lv.${newLevel}`}</div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{`${title} 단계에 들어섰어요.`}</div>
        </div>
        <div className="rounded-full bg-white/80 p-3 shadow-sm">
          <Trophy className="h-6 w-6 text-cyan-500" />
        </div>
      </div>
    </div>
  );
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
  const coachRecommendation = getCoachRecommendation(result);
  const priorityAction = getPriorityAction(result);
  const focusAge = getFocusAge(result.score, preferredAgeGroup);
  const recovery = getRecoveryPrescription(result);
  const workStyle = getWorkStyleRecommendation(result);
  const taskRecommendation = getTaskRecommendation(result);
  const { challenge, levelInfo, rankSnapshot, streak } = dataService;
  const patternSnapshot = getTimePattern(dataService.data.records || []);
  const timeSlotAnalysis = getTimeSlotAnalysis(dataService.data.records || []);
  const routine = getFocusRoutine(result, dataService.data.records || []);
  const retestPlan = getRetestPlan(result, dataService.data.records || []);
  const assetStatus = getAssetStatus({
    measuredDays: dataService.stats.measuredDays,
    streak,
    challenge,
    levelInfo,
    records: dataService.data.records || [],
  });
  const sharePersona = getSharePersonaSummary(result, preferredAgeGroup, dataService.data.records || []);
  const revisitReason = getRevisitReason({
    isTodayDone: true,
    streak,
    challenge,
    patternSnapshot,
  });
  const achievements = result.achievements || {};

  const achievementCards = [
    achievements.didLevelUp
      ? {
          key: "level-up",
          title: "레벨이 올랐어요",
          body: `${achievements.newLevelTitle} 단계에 새로 진입했습니다.`,
          tone: "amber",
          pulse: true,
        }
      : null,
    achievements.isNewAllTimeBest
      ? {
          key: "all-time",
          title: "내 최고 기록을 갱신했어요",
          body: `${result.score.toLocaleString()}점으로 개인 최고 기록이 새로 저장됐습니다.`,
          tone: "amber",
          pulse: true,
        }
      : null,
    achievements.isNewWeeklyBest
      ? {
          key: "weekly",
          title: "이번 주 최고 기록이에요",
          body: "이번 주 기준 가장 높은 집중 점수를 기록했습니다.",
          tone: "cyan",
        }
      : null,
    achievements.beatTodayBest
      ? {
          key: "today",
          title: "오늘 최고 기록을 올렸어요",
          body: "같은 날 안에서도 더 좋은 흐름으로 점수를 끌어올렸습니다.",
          tone: "emerald",
        }
      : null,
    achievements.unlocked7DayBadge
      ? {
          key: "badge",
          title: "7일 챌린지 배지를 획득했어요",
          body: "연속 측정 7일을 달성했습니다. 이제는 유지 흐름을 만들어보세요.",
          tone: "violet",
          pulse: true,
        }
      : null,
  ].filter(Boolean);

  const [copyMsg, setCopyMsg] = useState("");
  const [activeTab, setActiveTab] = useState("persona");
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiRest, setAiRest] = useState(null);
  const [aiRetro, setAiRetro] = useState(null);
  const [reflection, setReflection] = useState("");
  const [loadingKey, setLoadingKey] = useState(null);

  useEffect(() => {
    SoundManager.playSuccess();
  }, []);

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

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

  const handleShare = async () => {
    SoundManager.playClick();
    const strongest = result.batterySummary?.strongestStageLabel;
    const text = [
      "오늘 오르락 집중력 측정 완료",
      `등급: ${grade.label}`,
      `집중력 지수: ${result.score}점`,
      `집중 페르소나: ${persona.name}`,
      interpretation,
      strongest ? `강점 영역: ${strongest}` : null,
      "#오르락 #집중력루틴",
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "오르락 집중력 결과", text });
        return;
      } catch {
        // fallback
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("클립보드에 복사되었습니다.");
      window.setTimeout(() => setCopyMsg(""), 2400);
    } catch {
      setCopyMsg("공유 준비에 실패했습니다.");
      window.setTimeout(() => setCopyMsg(""), 2400);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center overflow-y-auto bg-slate-50 px-5 pb-5 pt-4 text-slate-900">
      {copyMsg ? (
        <div className="absolute top-8 z-50 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-xl">
          {copyMsg}
        </div>
      ) : null}

      <section className="mb-4 w-full max-w-sm rounded-[1.8rem] border border-slate-200 bg-white px-6 py-6 text-center shadow-lg">
        <div className="mb-1 flex items-center justify-center text-xs font-extrabold tracking-[0.2em] text-slate-400">
          <ArrowUp className="mr-1 h-4 w-4" strokeWidth={3} />
          오르락
        </div>
        <div className="mb-4 text-sm font-bold text-slate-500">{todayStr}</div>

        <div className="mb-1 text-[72px] font-black leading-none" style={{ color: grade.color }}>
          {grade.label}
        </div>
        <div className="text-[46px] font-black tracking-tight text-slate-950">{result.score.toLocaleString()}</div>
        <div className="mt-1 text-sm font-extrabold text-cyan-600">집중력 지수</div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-extrabold leading-relaxed text-slate-800">
          {interpretation}
        </div>
        <div className="mt-2 text-center text-[11px] font-semibold leading-relaxed text-slate-500">
          같은 60초 배터리 기준으로 비교한 결과예요. 오늘 컨디션 변화를 계속 추적하기 좋습니다.
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500">
            <span>{`${ageCompare.ageGroup} 평균 대비`}</span>
            <span className="text-sm font-black text-slate-900">{`상위 ${ageCompare.betterThan}%`}</span>
          </div>
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-200 shadow-inner">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${ageCompare.percentile}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MetricBlock label="반응 속도" value={grade.reaction} />
            <MetricBlock label="총 측정시간" value={`${result.duration}초`} />
            <MetricBlock label="실수 합계" value={`${result.falls}회`} />
          </div>
        </div>
      </section>

      {achievements.didLevelUp ? (
        <LevelUpBanner
          previousLevel={achievements.previousLevel}
          newLevel={achievements.newLevel}
          title={achievements.newLevelTitle}
        />
      ) : null}

      {achievementCards.length ? (
        <section className="mb-4 grid w-full max-w-sm gap-2.5">
          {achievementCards.map((card) => (
            <AchievementCard key={card.key} title={card.title} body={card.body} tone={card.tone} pulse={card.pulse} />
          ))}
        </section>
      ) : null}

      <section className="mb-4 grid w-full max-w-sm gap-2.5">
        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">TODAY ACTION</div>
            <div className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black text-cyan-700">지금 가장 먼저</div>
          </div>
          <div className="mt-2 text-base font-black text-slate-900">{priorityAction.title}</div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{priorityAction.body}</div>
          <div className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-[11px] font-semibold leading-relaxed text-slate-600">
            이 60초 결과를 기준으로 오늘 일정 우선순위를 바로 바꾸는 것이 오르락의 핵심입니다.
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MetricBlock label="업무 유형" value={workStyle.type.replace(" 타입", "")} />
            <MetricBlock label="집중력 나이" value={`${focusAge.focusAge}세`} />
            <MetricBlock label="강한 시간" value={timeSlotAnalysis.bestSlot} />
          </div>
          <button
            onClick={() => {
              SoundManager.playClick();
              onCoach(priorityAction.recommendedTab);
            }}
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-cyan-500 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-cyan-600"
          >
            {priorityAction.ctaLabel}
          </button>
          <div className="mt-2 rounded-xl border border-cyan-200 bg-white/80 px-3 py-2 text-[11px] font-semibold leading-relaxed text-slate-600">
            {retestPlan.summary}
          </div>
          <div className="mt-2 text-center text-[11px] font-semibold text-slate-500">
            {`추천 코치: ${coachRecommendation.label}`}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">TODAY GUIDE</div>
          <div className="mt-2 text-sm font-black text-slate-900">{prescription.title}</div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-xl bg-white/80 px-3 py-2.5">
              <div className="text-[10px] font-black text-cyan-700">지금 하면 좋은 일</div>
              <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{prescription.doNow}</div>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2.5">
              <div className="text-[10px] font-black text-rose-600">지금 피하면 좋은 일</div>
              <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{prescription.avoidNow}</div>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2.5">
              <div className="text-[10px] font-black text-cyan-700">다시 측정하면 좋은 시점</div>
              <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{prescription.recheck}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-sky-700">WHY COME BACK</div>
          <div className="mt-2 text-sm font-black text-slate-900">내일 다시 확인해야 하는 이유</div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{revisitReason}</div>
          <div className="mt-2 rounded-xl bg-white/80 px-3 py-2.5">
            <div className="text-[10px] font-black text-sky-700">{retestPlan.label}</div>
            <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{retestPlan.summary}</div>
          </div>
          {patternSnapshot.bestTimeOfDay !== "데이터 수집 중" ? (
            <div className="mt-3 rounded-xl bg-white/80 px-3 py-2.5">
              <div className="text-[10px] font-black text-sky-700">내가 가장 강한 시간대</div>
              <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">
                {`${patternSnapshot.bestTimeOfDay} 측정 평균 ${patternSnapshot.bestAverage.toLocaleString()}점`}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">PROGRESS UPDATE</div>
            <div className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-black text-cyan-700">{`Lv.${levelInfo.level}`}</div>
          </div>
          <div className="mt-2 text-sm font-black text-slate-900">{levelInfo.title}</div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">
            {challenge.completed ? "7일 챌린지를 달성했고 유지 구간에 들어섰어요." : `7일 챌린지 ${challenge.current}/${challenge.target} 진행 중이에요.`}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
            <div className="h-full rounded-full bg-cyan-400" style={{ width: `${levelInfo.progressPct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MetricBlock label="이번 주 최고" value={rankSnapshot.weeklyBest.toLocaleString()} />
            <MetricBlock label="내 최고" value={rankSnapshot.allTimeBest.toLocaleString()} />
            <MetricBlock label="연속 측정" value={`${challenge.current}일`} />
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">FOCUS PERSONA</div>
          <div className="mt-2 text-base font-black text-slate-900">{persona.name}</div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{persona.summary}</div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">FOCUS AGE</div>
          <div className="mt-2 text-base font-black text-slate-900">{`오늘 집중력 나이 ${focusAge.focusAge}세`}</div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{focusAge.summary}</div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">RECOVERY RX</div>
          <div className="mt-2 text-sm font-black text-slate-900">{recovery.status}</div>
          <div className="mt-3 grid gap-2">
            {recovery.steps.map((step) => (
              <div key={step} className="rounded-xl bg-white/80 px-3 py-2.5 text-[12px] font-semibold text-slate-700">
                {step}
              </div>
            ))}
          </div>
          <div className="mt-3 text-[12px] font-semibold leading-relaxed text-slate-600">{recovery.summary}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">WORK STYLE</div>
          <div className="mt-2 text-base font-black text-slate-900">{workStyle.type}</div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-xl bg-cyan-50 px-3 py-2.5">
              <div className="text-[10px] font-black text-cyan-700">추천 업무</div>
              <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{workStyle.recommended.join(" · ")}</div>
            </div>
            <div className="rounded-xl bg-rose-50 px-3 py-2.5">
              <div className="text-[10px] font-black text-rose-600">비추천 업무</div>
              <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{workStyle.discouraged.join(" · ")}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">TODAY TASKS</div>
          <div className="mt-2 text-sm font-black text-slate-900">{taskRecommendation.title}</div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-xl bg-white/80 px-3 py-2.5">
              <div className="text-[10px] font-black text-cyan-700">추천</div>
              <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{taskRecommendation.recommended.join(" · ")}</div>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2.5">
              <div className="text-[10px] font-black text-rose-600">비추천</div>
              <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{taskRecommendation.discouraged.join(" · ")}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">BEST TIME + ROUTINE</div>
          <div className="mt-2 text-sm font-black text-slate-900">{timeSlotAnalysis.profileLabel}</div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{timeSlotAnalysis.summary}</div>
          <div className="mt-3 rounded-xl bg-white/80 px-3 py-2.5">
            <div className="text-[10px] font-black text-cyan-700">{routine.title}</div>
            <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">{routine.steps.join(" → ")}</div>
          </div>
        </div>
      </section>

      {result.stageResults?.length ? (
        <section className="mb-4 grid w-full max-w-sm gap-2.5">
          {result.stageResults.map((stage) => (
            <div key={stage.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">{stage.title}</div>
                  <div className="mt-1 text-xs font-bold leading-relaxed text-slate-500">{summarizeStageMetric(stage)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500">점수</div>
                  <div className="text-lg font-black text-cyan-600">{stage.score.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {!insightsUnlocked ? (
        <section className="mb-4 w-full max-w-sm rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-rose-700">DEEP ANALYSIS</div>
          <div className="mt-2 text-sm font-black text-slate-900">심층 분석 열기</div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">
            광고를 보고 동물 페르소나, 휴식 처방, 오늘 회고 피드백까지 이어서 받아보세요.
          </div>
          <button
            onClick={() => {
              SoundManager.playClick();
              onUnlockInsights();
            }}
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-rose-500 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-rose-600"
          >
            <Video className="mr-1.5 h-4.5 w-4.5" />
            광고 보고 심층 분석 열기
          </button>
        </section>
      ) : (
        <section className="mb-4 flex min-h-[230px] max-h-[338px] w-full max-w-sm flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
          <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
            {[
              ["persona", "동물 페르소나"],
              ["rest", "휴식 처방전"],
              ["retro", "오늘 회고"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  SoundManager.playTab();
                  setActiveTab(key);
                }}
                className={`rounded-xl px-2 py-2.5 text-[11px] font-extrabold leading-tight tracking-[-0.01em] transition-all ${
                  activeTab === key ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "persona" ? (
            !aiFeedback ? (
              <button
                onClick={() =>
                  runAction("persona", async () => {
                    const response = await engine.getPersona(result.score, result.falls, resultContext);
                    setAiFeedback(response);
                  })
                }
                className="flex h-full min-h-[110px] items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-extrabold text-cyan-700 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                {loadingKey === "persona" ? "분석 중..." : "나의 집중력 동물 페르소나 받기"}
              </button>
            ) : (
              <ScrollableInsight title="맞춤 상세 리포트" tone="text-cyan-700" value={aiFeedback} />
            )
          ) : null}

          {activeTab === "rest" ? (
            !aiRest ? (
              <button
                onClick={() =>
                  runAction("rest", async () => {
                    const response = await engine.getRest(result.score, result.falls, resultContext);
                    setAiRest(response);
                  })
                }
                className="flex h-full min-h-[110px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700 shadow-sm"
              >
                <Coffee className="mr-1.5 h-4 w-4" />
                {loadingKey === "rest" ? "처방 중..." : "점수에 맞는 휴식법 받기"}
              </button>
            ) : (
              <ScrollableInsight title="맞춤 휴식 처방전" tone="text-cyan-700" value={aiRest} />
            )
          ) : null}

          {activeTab === "retro" ? (
            !aiRetro ? (
              <div className="flex h-full flex-col justify-center gap-3 px-1">
                <div className="text-sm font-bold leading-relaxed text-slate-600">
                  왜 오늘 이런 점수가 나왔는지 간단히 적어보세요.
                </div>
                <input
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="예: 수면이 부족한 상태에서 바로 측정함"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
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
                  onClick={() =>
                    runAction("retro", async () => {
                      const response = await engine.getRetro(reflection, result.score, resultContext);
                      setAiRetro(response);
                      setReflection("");
                    })
                  }
                  disabled={loadingKey === "retro" || !reflection.trim()}
                  className="flex items-center justify-center rounded-xl border border-cyan-200 bg-cyan-100 py-3 text-sm font-extrabold text-cyan-700 shadow-sm disabled:opacity-50"
                >
                  <MessageSquareText className="mr-1.5 h-4 w-4" />
                  {loadingKey === "retro" ? "분석 중..." : "피드백 받기"}
                </button>
              </div>
            ) : (
              <ScrollableInsight title="회고 피드백" tone="text-cyan-700" value={aiRetro} />
            )
          ) : null}
        </section>
      )}

      <div className="mb-3 grid w-full max-w-sm grid-cols-[1fr_1fr] gap-2.5">
        <button
          onClick={handleShare}
          className="flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-4 text-base font-black text-white shadow-md transition-colors hover:bg-cyan-600"
        >
          <Share className="mr-2 h-5 w-5" />
          공유하기
        </button>
        <button
          onClick={() => {
            SoundManager.playClick();
            onRetry();
          }}
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center text-sm font-black">
            <Video className="mr-1.5 h-4.5 w-4.5 text-rose-500" />
            다시 측정
          </div>
          <span className="mt-1 text-[10px] font-bold text-slate-500">광고 보고 1회 추가</span>
        </button>
      </div>

      <button
        onClick={() => {
          SoundManager.playClick();
          onHome();
        }}
        className="mb-3 flex w-full max-w-sm items-center justify-center rounded-2xl bg-slate-100 py-3.5 text-sm font-extrabold text-slate-600 shadow-sm transition-colors hover:bg-slate-200"
      >
        <Home className="mr-2 h-4.5 w-4.5" />
        홈으로 돌아가기
      </button>
    </div>
  );
}
