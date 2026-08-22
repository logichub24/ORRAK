import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Brain, ChevronLeft, Sparkles } from "lucide-react";
import { buildWeeklyContext } from "../lib/measureBattery";
import {
  getBadgeCollection,
  getFocusRiskAlert,
  getMomentumSnapshot,
  getTimePattern,
  getTimeSlotAnalysis,
  getWeeklyGrowthReport,
} from "../lib/progression";
import { getAssetStatus, getCollectionProgress } from "../lib/engagement";
import { SoundManager } from "../lib/soundManager";
import { getGrade } from "../lib/scoring";

function SegmentTabs({ activeSegment, onChange, guide }) {
  const segments = [
    { id: "summary", label: "요약" },
    { id: "growth", label: "성장" },
    { id: "collection", label: "배지" },
  ];

  return (
    <div className="mb-2.5 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-3 gap-1.5">
        {segments.map((segment) => (
          <button
            key={segment.id}
            onClick={() => {
              SoundManager.playTab();
              onChange(segment.id);
            }}
            className={`rounded-xl px-3 py-2.5 text-[13px] font-black transition-all ${
              activeSegment === segment.id
                ? "bg-cyan-500 text-white shadow-[0_10px_18px_rgba(6,182,212,0.24)]"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {segment.label}
          </button>
        ))}
      </div>
      <div className="reading-flow px-2 pb-1 pt-2 text-[11px] font-semibold leading-relaxed text-slate-500">{guide}</div>
    </div>
  );
}

function GrowthTabs({ activeTab, onChange }) {
  const tabs = [
    { id: "growth", label: "성장 변화" },
    { id: "pattern", label: "흐름 패턴" },
  ];

  return (
    <div className="mb-2.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
      <div className="grid grid-cols-2 gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              SoundManager.playTab();
              onChange(tab.id);
            }}
            className={`rounded-xl px-3 py-2.5 text-[13px] font-black transition-all ${
              activeTab === tab.id ? "bg-cyan-500 text-white shadow-sm" : "bg-slate-100 text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompactMetric({ label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <div className="text-[10px] font-extrabold tracking-[0.08em] text-slate-500">{label}</div>
      <div className={`mt-1 text-[0.95rem] font-black leading-snug ${accent ? "text-cyan-600" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

function MiniHint({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm">
      <div className="text-[10px] font-extrabold tracking-[0.06em] text-slate-500">{label}</div>
      <div className="mt-1 text-[13px] font-black leading-snug text-slate-900">{value}</div>
    </div>
  );
}

function WeeklyChangeSnapshot({ report }) {
  const changes = (report.stageGrowth || []).filter((item) => typeof item.percent === "number");
  const best = changes.reduce((selected, item) => (!selected || item.percent > selected.percent ? item : selected), null);
  const weakest = changes.reduce((selected, item) => (!selected || item.percent < selected.percent ? item : selected), null);
  const overall =
    report.overallDeltaPct === null
      ? "기록 수집 중"
      : report.overallDeltaPct >= 0
        ? `지난주 대비 +${report.overallDeltaPct}%`
        : `지난주 대비 ${report.overallDeltaPct}%`;

  return (
    <div className="mb-2.5 rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-blue-700">WEEKLY CHANGE</div>
          <div className="mt-1 text-[16px] font-black text-slate-950">지난주 대비 변화</div>
        </div>
        <div className="rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white">{overall}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-blue-200 bg-white/90 px-3 py-2.5">
          <div className="text-[10px] font-black text-blue-700">좋아진 점</div>
          <div className="reading-flow mt-1 text-[12px] font-extrabold leading-relaxed text-slate-900">
            {best && best.percent > 0 ? `${best.label} ${best.line}` : "기록이 쌓이면 상승 영역이 표시됩니다"}
          </div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-white/90 px-3 py-2.5">
          <div className="text-[10px] font-black text-rose-600">보완할 점</div>
          <div className="reading-flow mt-1 text-[12px] font-extrabold leading-relaxed text-slate-900">
            {weakest && weakest.percent < 0 ? `${weakest.label} ${weakest.line}` : "뚜렷한 하락 영역은 없습니다"}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGrowthGuide(measuredDays, type = "comparison") {
  if (type === "comparison") {
    if (measuredDays < 3) return "3일 측정 시 비교 분석이 시작됩니다";
    if (measuredDays < 7) return "7일 측정 시 전주 대비 변화가 또렷해집니다";
    return "최근 기록을 기준으로 상승과 하락 흐름을 비교 중입니다";
  }

  if (measuredDays < 5) return "5일 측정 시 시간대 패턴이 보이기 시작합니다";
  if (measuredDays < 7) return "7일 측정 시 주간 흐름 해석이 안정화됩니다";
  return "최근 기록으로 시간대와 주간 패턴을 분석 중입니다";
}

function ResetConfirmModal({ resetTarget, onCancel, onConfirm }) {
  if (!resetTarget || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/40 p-4 backdrop-blur-[1px] sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-rose-700">CONFIRM</div>
        <div className="mt-2 text-[16px] font-black text-slate-950">
          {resetTarget === "today" ? "오늘 기록을 초기화할까요?" : "전체 데이터를 초기화할까요?"}
        </div>
        <div className="reading-flow mt-2 text-[13px] font-semibold leading-relaxed text-slate-600">
          {resetTarget === "today"
            ? "오늘 측정 기록만 지워지고, 주간 비교와 오늘 요약이 다시 계산됩니다."
            : "측정 기록, 레벨, 챌린지, 배지가 모두 초기화됩니다. 연령대 설정은 유지됩니다."}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-[13px] font-extrabold text-slate-700"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl border border-rose-300 bg-rose-500 px-3 py-3 text-[13px] font-extrabold text-white"
          >
            {resetTarget === "today" ? "오늘 기록 초기화" : "전체 초기화"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function getPatternConfidence(measuredDays) {
  if (measuredDays >= 21) return "높음";
  if (measuredDays >= 10) return "안정";
  if (measuredDays >= 5) return "보통";
  return "수집 중";
}

function getStageKoreanLabel(stageId) {
  if (stageId === "reaction") return "반응 속도";
  if (stageId === "focus") return "선택적 주의";
  if (stageId === "flow") return "지속 집중";
  return "데이터 수집 중";
}

function getMetricDisplay(value, fallback = "기록 대기") {
  if (value === null || value === undefined || value === "" || value === "데이터 부족") return fallback;
  return value;
}

function WeeklyFlowChart({ weekRecords }) {
  return (
    <div className="mb-2.5 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-black text-slate-900">주간 흐름</h3>
        <div className="text-[11px] font-extrabold text-slate-500">최근 7일</div>
      </div>
      <div className="relative flex h-32 items-end justify-between">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2 opacity-40">
          <div className="h-0 w-full border-b border-slate-200" />
          <div className="h-0 w-full border-b border-slate-200" />
          <div className="h-0 w-full border-b border-slate-200" />
        </div>

        {weekRecords.map((record, index) => {
          const grade = record ? getGrade(record.score) : null;
          const height = record ? Math.max(10, Math.min(100, (record.score / 5000) * 100)) : 4;
          const date = new Date();
          date.setDate(date.getDate() - (6 - index));
          const dayLabel = date.toLocaleDateString("ko-KR", { weekday: "short" });

          return (
            <div key={`${record?.date || "empty"}-${index}`} className="relative z-10 flex w-7 flex-col items-center">
              <div className="mb-1 h-4 text-[10px] font-extrabold" style={{ color: grade?.color || "#9ca3af" }}>
                {record ? grade.label : ""}
              </div>
              <div className="flex h-20 w-full items-end justify-center overflow-hidden rounded-md bg-slate-100">
                <div
                  className="w-full rounded-t-md transition-all duration-1000 ease-out"
                  style={{ height: `${height}%`, backgroundColor: grade?.color || "#e5e7eb" }}
                />
              </div>
              <div className={`mt-2 text-[10px] font-extrabold ${index === 6 ? "text-cyan-600" : "text-slate-500"}`}>
                {index === 6 ? "오늘" : dayLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RecordScreen({ onBack, dataService, engine, onReplayOnboarding }) {
  const { weekRecords, data, streak, stats, challenge, levelInfo } = dataService;
  const validRecords = weekRecords.filter(Boolean);
  const weeklyContext = buildWeeklyContext(validRecords);
  const timePattern = getTimePattern(data.records || []);
  const slotAnalysis = getTimeSlotAnalysis(data.records || []);
  const momentum = getMomentumSnapshot(data.records || [], data.profile.preferredAgeGroup);
  const weeklyGrowthReport = getWeeklyGrowthReport(data.records || [], data.profile.preferredAgeGroup);
  const riskAlert = getFocusRiskAlert(data.records || []);
  const assetStatus = getAssetStatus({
    measuredDays: stats.measuredDays,
    streak,
    challenge,
    levelInfo,
    records: data.records || [],
  });
  const badges = getBadgeCollection({
    streak,
    measuredDays: stats.measuredDays,
    allTimeBest: stats.allTimeBest,
    level: levelInfo.level,
    challengeCompleted: challenge.completed,
  });
  const collection = getCollectionProgress(badges);

  const [weeklyReport, setWeeklyReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [activeSegment, setActiveSegment] = useState("summary");
  const [growthTab, setGrowthTab] = useState("growth");

  const preferredAgeGroup = data.profile?.preferredAgeGroup || "30대";
  const ageGroupAvg = {
    "20대": 3200,
    "30대": 2800,
    "40대": 2200,
    "50대": 1600,
    "60대": 1100,
  }[preferredAgeGroup];

  const segmentGuide = {
    summary: "이번 주 핵심 수치와 현재 흐름만 빠르게 확인합니다.",
    growth: "성장 변화와 흐름 패턴을 나누어 한눈에 살펴봅니다.",
    collection: "배지, 주간 인사이트, 초기화 기능 같은 관리 요소를 모았습니다.",
  };

  const summaryMetrics = [
    { label: "이번 주 평균", value: (stats.weekAvg || 0).toLocaleString(), accent: true },
    { label: "최고 기록", value: (stats.best || 0).toLocaleString() },
    { label: "연속 측정", value: `${streak}일`, accent: true },
    { label: "최고의 요일", value: getMetricDisplay(stats.bestDay) },
    { label: "최적 시간대", value: getMetricDisplay(stats.bestTime) },
    { label: "예측 정확도", value: `${assetStatus.accuracy.percent}%`, accent: true },
  ];
  const measuredDays = stats.measuredDays || 0;
  const growthGuide = getGrowthGuide(measuredDays, "comparison");
  const patternGuide = getGrowthGuide(measuredDays, "pattern");

  const handleWeeklyReport = async () => {
    SoundManager.playAI();
    setIsLoading(true);
    try {
      const report = await engine.getWeeklyReport(validRecords, weeklyContext);
      setWeeklyReport(report);
      SoundManager.playSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConfirm = () => {
    SoundManager.playClick();

    if (resetTarget === "today") {
      dataService.clearTodayRecord();
      setWeeklyReport(null);
    }

    if (resetTarget === "all") {
      dataService.resetProgress();
      setWeeklyReport(null);
    }

    setResetTarget(null);
  };

  return (
    <div className="scrollbar-none relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-slate-50 px-4 pb-4 pt-4 text-slate-900">
      <header className="mb-3 flex items-center pt-1">
        <button
          onClick={() => {
            SoundManager.playClick();
            onBack();
          }}
          className="-ml-2 p-2 text-slate-600 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="h-8 w-8" strokeWidth={3} />
        </button>
        <h2 className="ml-2 text-[1.7rem] font-black leading-none">내 기록</h2>
      </header>

      <SegmentTabs activeSegment={activeSegment} onChange={setActiveSegment} guide={segmentGuide[activeSegment]} />

      {activeSegment === "summary" ? (
        <>
          <div className="mb-2.5 rounded-[1.5rem] border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">SUMMARY</div>
                <div className="mt-1 text-[16px] font-black text-slate-950">한눈에 보는 이번 주</div>
              </div>
              <div className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black text-cyan-700">자산 {assetStatus.assetScore}점</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {summaryMetrics.map((metric) => (
                <CompactMetric key={metric.label} label={metric.label} value={metric.value} accent={metric.accent} />
              ))}
            </div>
          </div>

          <WeeklyChangeSnapshot report={weeklyGrowthReport} />
        </>
      ) : null}

      {activeSegment === "growth" ? (
        <>
          <GrowthTabs activeTab={growthTab} onChange={setGrowthTab} />

          {growthTab === "growth" ? (
            <>
              <div className="mb-2.5 rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">WEEKLY GROWTH REPORT</div>
                <div className="mt-2 text-[15px] font-black text-slate-900">{`이번 주 등급 ${weeklyGrowthReport.weekGrade}`}</div>
                <div className="reading-flow mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">{weeklyGrowthReport.summary}</div>
                <div className="mt-3 grid gap-2">
                  {weeklyGrowthReport.stageGrowth.map((item, index) => (
                    <MiniHint
                      key={item.id}
                      label={item.label}
                      value={
                        typeof item.percent === "number"
                          ? item.line
                          : index === 0
                            ? "3일 측정 시 반응 비교 시작"
                            : index === 1
                              ? "5일 측정 시 주의 흐름 표시"
                              : "7일 측정 시 지속 집중 비교"
                      }
                    />
                  ))}
                  <MiniHint label="최고 집중 시간" value={weeklyGrowthReport.bestTimeWindow} />
                  <MiniHint label="주간 집중력 나이" value={`${weeklyGrowthReport.focusAge.focusAge}세`} />
                </div>
                <div className="mt-2 rounded-xl border border-cyan-200 bg-white/80 px-3 py-2 text-[11px] font-semibold leading-relaxed text-slate-700">
                  {growthGuide}
                </div>
              </div>

              <div className="mb-2.5 rounded-[1.5rem] border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">MOMENTUM</div>
                <div className="mt-1 text-[15px] font-black text-slate-900">{momentum.bestLine}</div>
                <div className="reading-flow mt-1 text-[12px] font-semibold leading-relaxed text-slate-600">{assetStatus.moat}</div>
                <div className="mt-2 rounded-xl border border-sky-200 bg-white/80 px-3 py-2 text-[11px] font-semibold leading-relaxed text-slate-700">
                  {patternGuide}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MiniHint label="상승 흐름" value={momentum.trendLine} />
                  <MiniHint label="집중력 나이" value={momentum.focusAgeLine} />
                </div>
              </div>

              <div className={`mb-2.5 rounded-[1.5rem] border p-3.5 shadow-sm ${riskAlert.level === "warn" ? "border-rose-200 bg-rose-50" : "border-cyan-200 bg-cyan-50"}`}>
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-700">FOCUS RISK ALERT</div>
                <div className="mt-2 text-[15px] font-black text-slate-900">{riskAlert.title}</div>
                <div className="reading-flow mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">{riskAlert.body}</div>
              </div>

              <div className="mb-4 rounded-[1.5rem] border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">{`${preferredAgeGroup} 평균 비교`}</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CompactMetric label="내 평균" value={(stats.weekAvg || 0).toLocaleString()} accent />
                  <CompactMetric label={`${preferredAgeGroup} 평균`} value={ageGroupAvg.toLocaleString()} />
                </div>
                <div className="reading-flow mt-3 rounded-xl bg-slate-50 px-3 py-3 text-[12px] font-semibold leading-relaxed text-slate-700">
                  {stats.weekAvg > ageGroupAvg
                    ? `${preferredAgeGroup} 평균보다 ${(((stats.weekAvg / ageGroupAvg) - 1) * 100).toFixed(0)}% 높아요. 지금 흐름을 유지해보세요.`
                    : `${preferredAgeGroup} 평균까지 ${(ageGroupAvg - stats.weekAvg).toLocaleString()}점 남아 있어요.`}
                </div>
              </div>
            </>
          ) : null}

          {growthTab === "pattern" ? (
            <>
              <div className="mb-2.5 rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">FOCUS STATUS</div>
                    <div className="mt-1 text-[15px] font-black text-slate-900">{levelInfo.title}</div>
                  </div>
                  <div className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-cyan-700">{`Lv.${levelInfo.level}`}</div>
                </div>
                <div className="reading-flow mt-2 text-[12px] font-semibold leading-relaxed text-slate-700">
                  {challenge.completed ? "7일 챌린지를 달성했고 다음 레벨 구간으로 올라가고 있어요." : `7일 챌린지 ${challenge.current}/${challenge.target} 진행 중이에요.`}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${levelInfo.progressPct}%` }} />
                </div>
              </div>

              <WeeklyFlowChart weekRecords={weekRecords} />

              <div className="mb-2.5 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-3.5 shadow-sm">
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-sky-700">PATTERN GUIDE</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MiniHint label="이번 주 강점" value={getStageKoreanLabel(weeklyContext.bestStageId)} />
                  <MiniHint label="이번 주 보완" value={getStageKoreanLabel(weeklyContext.weakestStageId)} />
                  <MiniHint label="가장 강한 시간대" value={timePattern.bestTimeOfDay} />
                  <MiniHint label="패턴 신뢰도" value={getPatternConfidence(stats.measuredDays)} />
                </div>
              </div>

              <div className="mb-4 rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">TIME SLOT ANALYSIS</div>
                <div className="mt-2 text-[15px] font-black text-slate-900">{slotAnalysis.profileLabel}</div>
                <div className="reading-flow mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">{slotAnalysis.summary}</div>
                <div className="mt-3 grid gap-2">
                  {slotAnalysis.slots.slice(0, 4).map((slot) => (
                    <MiniHint key={slot.label} label={`${slot.label} · ${slot.status}`} value={slot.average ? `${slot.average}점` : "-"} />
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {activeSegment === "collection" ? (
        <>
          <div className="mb-2.5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-3.5 shadow-sm">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-amber-700">COLLECTION PROGRESS</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-[15px] font-black text-slate-900">{`${collection.unlocked}/${collection.total} 배지 잠금 해제`}</div>
                <div className="reading-flow mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">
                  {collection.nextBadge ? `다음 목표: ${collection.nextBadge.label}` : "모든 배지를 모았어요"}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1.5 text-[12px] font-black text-amber-700 shadow-sm">{`${collection.percent}%`}</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${collection.percent}%` }} />
            </div>
          </div>

          <div className="mb-2.5 grid grid-cols-3 gap-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`rounded-2xl border px-3 py-4 text-center shadow-sm ${
                  badge.unlocked ? "border-amber-200 bg-white" : "border-slate-200 bg-slate-100 opacity-70"
                }`}
              >
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-xs font-black ${
                    badge.unlocked ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {badge.shortLabel}
                </div>
                <div className="mt-2 text-[12px] font-black leading-snug text-slate-900">{badge.label}</div>
                <div className="reading-flow mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">{badge.description}</div>
              </div>
            ))}
          </div>

          <div className="mb-2.5">
            <h3 className="mb-2 ml-1 flex items-center text-base font-extrabold text-slate-800">
              <Sparkles className="mr-1.5 h-5 w-5 text-cyan-600" />
              주간 인사이트
            </h3>

            {!weeklyReport ? (
              <button
                onClick={handleWeeklyReport}
                disabled={isLoading || validRecords.length === 0}
                className="flex w-full items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 py-4 text-[15px] font-extrabold text-cyan-700 shadow-sm transition-all hover:bg-cyan-100 disabled:opacity-50"
              >
                {isLoading ? "분석 중..." : validRecords.length === 0 ? "기록이 없어 분석할 수 없어요" : "나의 주간 집중 패턴 분석하기"}
              </button>
            ) : (
              <div className="relative rounded-[1.6rem] border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
                <div className="absolute right-4 top-4 text-cyan-200">
                  <Brain className="h-10 w-10" />
                </div>
                <div className="reading-flow relative z-10 whitespace-pre-wrap pr-8 text-[13px] font-semibold leading-relaxed text-slate-800">
                  {weeklyReport}
                </div>
              </div>
            )}
          </div>

          <div className="mb-2.5 rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">ONBOARDING</div>
            <div className="mt-2 text-[15px] font-black text-slate-900">앱 가치 다시 보기</div>
            <div className="reading-flow mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">
              오르락이 어떻게 측정하고, 오늘 할 일을 어떻게 추천하는지 다시 확인할 수 있습니다.
            </div>
            <button
              onClick={() => {
                SoundManager.playClick();
                onReplayOnboarding?.();
              }}
              className="mt-3 w-full rounded-xl border border-cyan-200 bg-white px-3 py-3 text-[13px] font-extrabold text-cyan-700 shadow-sm transition-colors hover:bg-cyan-100"
            >
              온보딩 다시 보기
            </button>
          </div>

          <div className="mb-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-3.5 shadow-sm">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-rose-700">RESET</div>
            <div className="mt-2 text-[15px] font-black text-slate-900">기록 다시 시작</div>
            <div className="reading-flow mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">
              오늘 기록만 지우거나 전체 측정 데이터를 초기화할 수 있습니다. 전체 초기화는 레벨, 챌린지, 배지까지 함께 다시 시작됩니다.
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  SoundManager.playClick();
                  setResetTarget("today");
                }}
                disabled={!dataService.isTodayDone}
                className="rounded-xl border border-rose-200 bg-white px-3 py-3 text-[12px] font-extrabold text-rose-700 shadow-sm transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                오늘 기록 초기화
              </button>
              <button
                onClick={() => {
                  SoundManager.playClick();
                  setResetTarget("all");
                }}
                className="rounded-xl border border-rose-300 bg-rose-500 px-3 py-3 text-[12px] font-extrabold text-white shadow-sm transition-colors hover:bg-rose-600"
              >
                전체 데이터 초기화
              </button>
            </div>
          </div>
        </>
      ) : null}

      <ResetConfirmModal
        resetTarget={resetTarget}
        onCancel={() => {
          SoundManager.playClick();
          setResetTarget(null);
        }}
        onConfirm={handleResetConfirm}
      />
    </div>
  );
}
