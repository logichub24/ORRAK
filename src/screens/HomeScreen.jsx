import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ArrowUp, BellRing, Brain, Clock3, Flame, Rocket, Trophy, X } from "lucide-react";
import {
  getCoachRecommendation,
  getCognitiveConditionReport,
  getDailyBrief,
  getFocusRoutine,
  getFocusPersona,
  getPatternForecast,
  getPredictiveAlert,
  getRecommendedMeasurementTime,
  getSkipCostMessage,
  getTaskRecommendation,
  getTimeSlotAnalysis,
  getTodayGoal,
} from "../lib/progression";
import { getAssetStatus, getDailyTheme, getHomeDecisionBundle } from "../lib/engagement";
import { SoundManager } from "../lib/soundManager";
import { getGrade } from "../lib/scoring";
import { trackEvent } from "../lib/analytics";

function FocusRoutineModal({ open, onClose, routine, reminderTime, onApplyReminder }) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/45 p-4 backdrop-blur-[2px] sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-[1.7rem] border border-cyan-200 bg-white p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">FOCUS ROUTINE</div>
            <div className="mt-1 text-[18px] font-black text-slate-950">{routine.title}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {routine.steps.map((step, index) => (
            <div key={`${step}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[10px] font-black text-cyan-700">{`${index + 1}단계`}</div>
              <div className="mt-1 text-[14px] font-black text-slate-900">{step}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-3">
          <div className="text-[10px] font-black text-cyan-700">알림 예약</div>
          <div className="mt-1 text-[14px] font-black text-slate-900">
            {`다음 측정 알림을 ${reminderTime}에 받을 수 있도록 설정합니다.`}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onApplyReminder}
            className="rounded-xl bg-cyan-500 px-3 py-3 text-[13px] font-black text-white shadow-sm"
          >
            알림 적용하기
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-[13px] font-black text-slate-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function HeroCard({ isTodayDone, todayResult, grade, rankSnapshot, onStart }) {
  const startButton = (
    <button
      onClick={() => {
        SoundManager.playClick();
        trackEvent("home_cta_click", { variant: "score_promise" });
        onStart();
      }}
      className="inline-flex min-h-[44px] items-center rounded-full bg-cyan-500 px-6 py-2.5 text-[15px] font-black text-white shadow-[0_8px_18px_rgba(6,182,212,0.28)]"
    >
      60초 집중력 점수 확인
      <ArrowRight className="ml-1.5 h-4 w-4" />
    </button>
  );

  if (!isTodayDone) {
    return (
      <div className="relative min-h-[198px] overflow-hidden rounded-[1.6rem] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-sky-50 px-4 pb-4 pt-4 shadow-[0_10px_24px_rgba(15,23,42,0.11)]">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-100 opacity-70 blur-[55px]" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-sky-100 opacity-40 blur-[45px]" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[1.45rem] border border-cyan-200 bg-cyan-100/90 shadow-[0_10px_24px_rgba(34,211,238,0.18)]">
              <Brain className="h-10 w-10 text-cyan-600" />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="text-[19px] font-black leading-tight tracking-tight text-slate-950">
                오늘 측정이 아직 없어요
              </div>
              <div className="reading-flow mt-1.5 text-[14px] font-semibold leading-[1.5] text-slate-500">
                중요한 일 시작 전에
                <br />
                오늘의 집중력 리듬을 먼저 확인해보세요.
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-center">{startButton}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.65rem] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-sky-50 px-5 pb-4 pt-4 shadow-[0_10px_24px_rgba(15,23,42,0.11)]">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-100 opacity-70 blur-[55px]" />
      <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-sky-100 opacity-40 blur-[45px]" />

      <div className="relative z-10 flex items-center justify-between gap-5">
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[20px] font-black text-slate-700">오늘의 집중력 지수</div>
          <div className="mt-2 text-[60px] font-black leading-none tracking-tighter" style={{ color: grade.color }}>
            {todayResult.score.toLocaleString()}
          </div>
        </div>

        <div className="w-[116px] shrink-0 text-right">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-[12px] font-extrabold text-slate-800 shadow-sm">
            {`${grade.label} 등급`}
          </div>
          <div className="mt-2 text-[22px] font-black leading-tight text-slate-900">{grade.name}</div>
          {rankSnapshot ? (
            <div className="mt-2 flex items-center justify-end gap-1 text-[14px] font-black text-cyan-700">
              <Trophy className="h-4 w-4" />
              {`상위 ${rankSnapshot.topPercent}% 기록`}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DailyBriefCard({ brief, predictiveAlert, rankSnapshot, streak, assetStatus, skipCost }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">DAILY BRIEF</div>
        <div className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700">
          오늘만 유효
        </div>
      </div>

      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
        <div className="text-[10px] font-black text-rose-600">{skipCost.title}</div>
        <div className="reading-flow mt-1 text-[11px] font-semibold leading-relaxed text-slate-700">{skipCost.body}</div>
      </div>

      <div className="mt-2 text-[17px] font-black leading-snug text-slate-900">{brief.headline}</div>
      <div className="reading-flow mt-1.5 text-[13px] font-semibold leading-relaxed text-slate-600">{brief.summary}</div>

      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        <div className="rounded-xl bg-slate-50 px-2.5 py-2">
          <div className="text-[10px] font-black text-slate-500">상대 위치</div>
          <div className="mt-1 text-[12px] font-black text-slate-900">
            {rankSnapshot ? `상위 ${rankSnapshot.topPercent}%` : "첫 기록"}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-2.5 py-2">
          <div className="text-[10px] font-black text-slate-500">연속 기록</div>
          <div className="mt-1 text-[12px] font-black text-slate-900">{`${streak}일`}</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-2.5 py-2">
          <div className="text-[10px] font-black text-slate-500">예상 알림</div>
          <div className="mt-1 text-[12px] font-black text-slate-900">도움됨</div>
        </div>
      </div>

      <div className="mt-2.5 rounded-xl border border-blue-200 bg-blue-100/70 px-3 py-2.5">
        <div className="text-[10px] font-black text-blue-700">{predictiveAlert.title}</div>
        <div className="reading-flow mt-1 text-[11px] font-semibold leading-relaxed text-slate-700">{brief.footer}</div>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
        <div className="text-[10px] font-black text-slate-500">예측 정확도</div>
        <div className="text-[11px] font-black text-slate-900">{`${assetStatus.accuracy.percent}% · ${assetStatus.accuracy.label}`}</div>
      </div>
    </div>
  );
}

function HomeCognitiveStatusCard({ report }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-blue-700">TODAY CONDITION</div>
          <div className="mt-1 text-[17px] font-black leading-snug text-slate-950">오늘의 인지 상태</div>
        </div>
        <div className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-white shadow-sm">
          <div className="text-[20px] font-black leading-none">{report.gradeLabel}</div>
          <div className="mt-1 text-[10px] font-extrabold opacity-85">{report.statusLabel}</div>
        </div>
      </div>

      <div className="mt-2.5 rounded-xl border border-blue-200 bg-white/90 px-3 py-2.5">
        <div className="text-[10px] font-black text-blue-700">최근 평균 대비</div>
        <div className="mt-1 text-[14px] font-black text-slate-950">{report.averageLine}</div>
      </div>

      <div className="mt-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5">
        <div className="text-[10px] font-black text-cyan-700">오늘 추천 업무</div>
        <div className="mt-1 text-[13px] font-black leading-relaxed text-slate-900">{report.suitableTasks.join(" · ")}</div>
      </div>
    </div>
  );
}

function CuriosityCard({ goal, forecast, persona, assetStatus }) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white px-4 py-3.5 shadow-sm">
      <div className="text-[11px] font-extrabold tracking-[0.18em] text-violet-700">NEXT SIGNAL</div>
      <div className="mt-1 text-[17px] font-black text-slate-950">다음 기록에서 밝혀질 것</div>
      <div className="mt-2.5 grid gap-2">
        <div className="rounded-xl bg-white/90 px-3 py-2"><div className="text-[10px] font-black text-violet-700">오늘 미션</div><div className="mt-1 text-[12px] font-black text-slate-900">{goal.title}</div></div>
        <div className="rounded-xl bg-white/90 px-3 py-2"><div className="text-[10px] font-black text-violet-700">내일 예측</div><div className="mt-1 text-[12px] font-black text-slate-900">{forecast.opportunity}</div></div>
        <div className="rounded-xl bg-white/90 px-3 py-2"><div className="text-[10px] font-black text-violet-700">다음 해금</div><div className="mt-1 text-[12px] font-black text-slate-900">{assetStatus.nextUnlock || `${persona.name} 페르소나 심화`}</div></div>
      </div>
    </div>
  );
}

function ActionSummaryCard({
  decisionBundle,
  recommendation,
  recommendedTime,
  dailyTheme,
  coachRecommendation,
  onOpenCoach,
}) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-extrabold tracking-[0.16em] text-blue-700">TODAY ACTION</div>
        <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-blue-700 shadow-sm">
          {recommendedTime.label}
        </div>
      </div>

      <div className="mt-1.5 text-[17px] font-black leading-snug text-slate-900">{decisionBundle.firstActionTitle}</div>
      <div className="reading-flow mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">
        {decisionBundle.firstActionBody}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-blue-700 shadow-sm">
          {recommendedTime.window}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm">
          {decisionBundle.bestSlot}
        </span>
      </div>

      <div className="mt-2 grid gap-1.5">
        <div className="rounded-xl bg-white/80 px-3 py-2">
          <div className="text-[10px] font-black text-blue-700">추천</div>
          <div className="reading-flow mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">
            {recommendation.recommended.slice(0, 2).join(" · ")}
          </div>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2">
          <div className="text-[10px] font-black text-rose-600">비추천</div>
          <div className="reading-flow mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">
            {recommendation.discouraged.slice(0, 2).join(" · ")}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-xl border border-blue-200 bg-white/80 px-3 py-2">
        <div className="text-[10px] font-black text-blue-700">{dailyTheme.badge}</div>
        <div className="mt-1 text-[12px] font-black text-slate-900">{dailyTheme.title}</div>
        <div className="reading-flow mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{dailyTheme.body}</div>
      </div>

      <button
        onClick={() => {
          SoundManager.playClick();
          onOpenCoach(coachRecommendation.tab);
        }}
        className="mt-2 flex w-full items-center justify-center rounded-xl bg-white py-2.5 text-[13px] font-black text-blue-700 shadow-sm transition-colors hover:bg-blue-100"
      >
        {`${coachRecommendation.label} 바로 열기`}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </button>
    </div>
  );
}

function PatternCard({ slotAnalysis, assetStatus }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 shadow-sm">
      <div className="text-[12px] font-extrabold tracking-[0.16em] text-blue-700">TIME PATTERN</div>
      <div className="mt-2 text-[17px] font-black leading-snug text-slate-900">{slotAnalysis.profileLabel}</div>
      <div className="reading-flow mt-1.5 text-[14px] font-semibold leading-relaxed text-slate-700">{slotAnalysis.summary}</div>

      <div className="mt-2.5 grid gap-2">
        <div className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2">
          <div>
            <div className="text-[11px] font-black text-slate-900">가장 강한 시간</div>
            <div className="text-[10px] font-semibold text-slate-500">{slotAnalysis.bestSlot}</div>
          </div>
          <div className="text-[11px] font-black text-blue-700">{assetStatus.nextUnlock}</div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2">
          <div>
            <div className="text-[11px] font-black text-slate-900">주의 시간</div>
            <div className="text-[10px] font-semibold text-slate-500">{slotAnalysis.weakestSlot}</div>
          </div>
          <div className="text-[11px] font-black text-rose-600">흐름 확인</div>
        </div>
      </div>
    </div>
  );
}

function ReminderCard({ reminderEnabled, reminderTime, onPreset, onToggle }) {
  const presetGroups = [
    {
      label: "오전",
      items: [
        { time: "07:00", label: "7:00" },
        { time: "08:30", label: "8:30" },
      ],
    },
    {
      label: "점심",
      items: [
        { time: "12:00", label: "12:00" },
        { time: "13:30", label: "1:30" },
      ],
    },
    {
      label: "저녁",
      items: [
        { time: "19:00", label: "7:00" },
        { time: "21:00", label: "9:00" },
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">REMINDER</div>
          <div className="mt-1 text-[16px] font-black text-slate-950">다음 측정 알림</div>
        </div>
        <button
          onClick={onToggle}
          className={`rounded-full px-3 py-1.5 text-[11px] font-black shadow-sm ${
            reminderEnabled ? "bg-cyan-500 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {reminderEnabled ? "사용 중" : "끄기"}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-3">
        <BellRing className="h-4.5 w-4.5 text-cyan-700" />
        <div className="text-[13px] font-black text-slate-900">
          {reminderEnabled ? `${reminderTime}에 알림을 받도록 설정되어 있어요.` : "알림이 꺼져 있어요. 다시 켜면 추천 시간에 알려드려요."}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {presetGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-1 text-[10px] font-black text-slate-500">{group.label}</div>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((preset) => (
                <button
                  key={preset.time}
                  onClick={() => onPreset(preset.time)}
                  className={`rounded-xl border px-3 py-2.5 text-[12px] font-black ${
                    reminderTime === preset.time
                      ? "border-cyan-300 bg-cyan-100 text-cyan-800"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {`${group.label} ${preset.label}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutinePreviewCard({ routine, reminderTime, onOpen }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-blue-700">AUTO ROUTINE</div>
          <div className="mt-1 text-[16px] font-black text-slate-950">집중 루틴 자동 실행</div>
        </div>
        <Clock3 className="h-5 w-5 text-blue-700" />
      </div>

      <div className="mt-2.5 grid gap-1.5">
        {routine.steps.slice(0, 3).map((step, index) => (
          <div key={`${step}-${index}`} className="rounded-xl border border-white/70 bg-white/80 px-3 py-2">
            <div className="text-[10px] font-black text-blue-700">{`${index + 1}단계`}</div>
            <div className="mt-1 text-[13px] font-black text-slate-900">{step}</div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-[12px] font-semibold leading-relaxed text-slate-700">
        {`다음 알림 시간은 ${reminderTime}입니다. 측정 후 바로 루틴으로 이어가면 오늘 흐름을 더 길게 유지할 수 있어요.`}
      </div>

      <button
        onClick={onOpen}
        className="mt-2.5 flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-[13px] font-black text-white shadow-sm"
      >
        <Rocket className="mr-1.5 h-4 w-4" />
        루틴 자세히 보기
      </button>
    </div>
  );
}

function SegmentTabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-[13px] font-black transition-all ${
        active
          ? "bg-cyan-500 text-white shadow-[0_8px_18px_rgba(6,182,212,0.22)]"
          : "bg-white text-slate-600 shadow-sm"
      }`}
    >
      {label}
    </button>
  );
}

export function HomeScreen({ onStart, onCoach, dataService }) {
  const scrollRef = useRef(null);
  const [activeSegment, setActiveSegment] = useState("today");
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const { todayResult, isTodayDone, streak, diffFromYesterday, rankSnapshot } = dataService;
  const grade = isTodayDone ? getGrade(todayResult.score) : null;
  const slotAnalysis = getTimeSlotAnalysis(dataService.data.records || []);
  const recommendedTime = getRecommendedMeasurementTime(dataService.data.records || []);
  const coachRecommendation = getCoachRecommendation(todayResult);
  const taskRecommendation = getTaskRecommendation(todayResult);
  const dailyTheme = getDailyTheme();
  const cognitiveReport = isTodayDone ? getCognitiveConditionReport(todayResult, dataService.data.records || []) : null;
  const focusRoutine = getFocusRoutine(todayResult, dataService.data.records || []);
  const decisionBundle = getHomeDecisionBundle(
    todayResult,
    dataService.data.records || [],
    dataService.data.profile.preferredAgeGroup
  );
  const assetStatus = getAssetStatus({
    measuredDays: dataService.stats?.measuredDays || 0,
    streak,
    challenge: dataService.challenge,
    levelInfo: dataService.levelInfo,
    records: dataService.data.records || [],
  });
  const predictiveAlert = getPredictiveAlert({
    records: dataService.data.records || [],
    isTodayDone,
    todayResult,
    recommendedTime,
    challenge: dataService.challenge,
  });
  const skipCost = getSkipCostMessage({
    isTodayDone,
    streak,
    challenge: dataService.challenge,
    recommendedTime,
  });
  const dailyBrief = getDailyBrief({
    isTodayDone,
    diffFromYesterday,
    rankSnapshot,
    challenge: dataService.challenge,
    predictiveAlert,
  });
  const curiosityGoal = getTodayGoal({ isTodayDone, streak, patternSnapshot: dataService.stats, recommendedTime });
  const curiosityForecast = getPatternForecast(dataService.data.records || []);
  const curiosityPersona = getFocusPersona(todayResult || { score: 0, falls: 0 });

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const reminderEnabled = dataService.data.profile?.reminderEnabled ?? true;
  const reminderTime = dataService.data.profile?.reminderTime || "08:00";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeSegment]);

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-50 px-4 pb-2 pt-4 text-slate-900"
      onClick={() => SoundManager.init()}
    >
      <FocusRoutineModal
        open={showRoutineModal}
        onClose={() => setShowRoutineModal(false)}
        routine={focusRoutine}
        reminderTime={reminderTime}
        onApplyReminder={() => {
          dataService.updateProfile({ reminderEnabled: true, reminderTime });
          setShowRoutineModal(false);
        }}
      />

      <header className="mb-3 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ArrowUp className="h-7 w-7 text-cyan-600" />
          <span className="text-[34px] font-black tracking-tight text-slate-950">오르락</span>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[16px] font-extrabold text-slate-700 shadow-sm">
          {todayStr}
        </span>
      </header>

      <div className="scrollbar-none mb-2.5 flex shrink-0 gap-2 overflow-x-auto pb-1">
        <SegmentTabButton active={activeSegment === "today"} label="오늘" onClick={() => setActiveSegment("today")} />
        <SegmentTabButton active={activeSegment === "recommend"} label="추천" onClick={() => setActiveSegment("recommend")} />
        <SegmentTabButton active={activeSegment === "pattern"} label="패턴" onClick={() => setActiveSegment("pattern")} />
      </div>

      <div ref={scrollRef} className="scrollbar-none flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-3 pt-0.5">
        {activeSegment === "today" ? (
          <>
            {streak >= 2 ? (
              <div className="flex shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-cyan-700 shadow-sm">
                <Flame className="mr-2 h-5 w-5 text-cyan-600" />
                <span className="text-sm font-extrabold">{`연속 ${streak}일 측정 중이에요`}</span>
              </div>
            ) : null}

            <HeroCard
              isTodayDone={isTodayDone}
              todayResult={todayResult}
              grade={grade}
              rankSnapshot={rankSnapshot}
              onStart={onStart}
            />

            {diffFromYesterday !== null && isTodayDone ? (
              <div className={`-mt-1 text-center text-xs font-extrabold ${diffFromYesterday >= 0 ? "text-cyan-600" : "text-rose-600"}`}>
                {`어제보다 ${diffFromYesterday >= 0 ? "상승" : "하락"} ${Math.abs(diffFromYesterday).toLocaleString()}점`}
              </div>
            ) : null}

            {isTodayDone ? (
              <HomeCognitiveStatusCard report={cognitiveReport} />
            ) : (
              <DailyBriefCard
                brief={dailyBrief}
                predictiveAlert={predictiveAlert}
                rankSnapshot={rankSnapshot}
                streak={streak}
                assetStatus={assetStatus}
                skipCost={skipCost}
              />
            )}
            <CuriosityCard goal={curiosityGoal} forecast={curiosityForecast} persona={curiosityPersona} assetStatus={assetStatus} />
          </>
        ) : null}

        {activeSegment === "recommend" ? (
          <>
            <ActionSummaryCard
              decisionBundle={decisionBundle}
              recommendation={taskRecommendation}
              recommendedTime={recommendedTime}
              dailyTheme={dailyTheme}
              coachRecommendation={coachRecommendation}
              onOpenCoach={onCoach}
            />
            <RoutinePreviewCard
              routine={focusRoutine}
              reminderTime={reminderTime}
              onOpen={() => setShowRoutineModal(true)}
            />
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">WHY THIS</div>
              <div className="reading-flow mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">
                오늘 측정 결과를 기준으로 가장 먼저 할 일과 피해야 할 일을 바로 연결해 보여주기 때문에, 앱을 열자마자 행동으로 옮기기 쉬워집니다.
              </div>
            </div>
          </>
        ) : null}

        {activeSegment === "pattern" ? (
          <>
            <PatternCard slotAnalysis={slotAnalysis} assetStatus={assetStatus} />
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">FOCUS SIGNAL</div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="text-[10px] font-black text-slate-500">추천 측정 시간</div>
                  <div className="mt-1 text-[14px] font-black text-slate-900">{recommendedTime.label}</div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="text-[10px] font-black text-slate-500">오늘의 업무 유형</div>
                  <div className="mt-1 text-[14px] font-black text-slate-900">{decisionBundle.workStyle}</div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="text-[10px] font-black text-slate-500">집중력 나이</div>
                  <div className="mt-1 text-[14px] font-black text-slate-900">{decisionBundle.focusAge}</div>
                </div>
              </div>
            </div>
            <ReminderCard
              reminderEnabled={reminderEnabled}
              reminderTime={reminderTime}
              onPreset={(preset) => dataService.updateProfile({ reminderEnabled: true, reminderTime: preset })}
              onToggle={() => dataService.updateProfile({ reminderEnabled: !reminderEnabled })}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
