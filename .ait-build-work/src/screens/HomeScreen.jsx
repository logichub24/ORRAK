import React, { useEffect, useRef } from "react";
import { ArrowRight, ArrowUp, Brain, Flame, Sparkles, Trophy } from "lucide-react";
import {
  getCoachRecommendation,
  getDailyBrief,
  getFocusAge,
  getPredictiveAlert,
  getRecommendedMeasurementTime,
  getSkipCostMessage,
  getTaskRecommendation,
  getTimeSlotAnalysis,
  getTimePattern,
  getWorkStyleRecommendation,
} from "../lib/progression";
import { getAssetStatus, getDailyTheme, getHomeDecisionBundle } from "../lib/engagement";
import { SoundManager } from "../lib/soundManager";
import { getGrade } from "../lib/scoring";

function HeroCard({ isTodayDone, todayResult, grade, rankSnapshot, decisionBundle, onStart }) {
  return (
    <div className="relative flex min-h-[192px] flex-col justify-start overflow-hidden rounded-[1.8rem] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-sky-50 px-4 pt-4 pb-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-100 opacity-70 blur-[55px]" />
      <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-sky-100 opacity-40 blur-[45px]" />

      {!isTodayDone ? (
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center gap-4">
            <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-[1.6rem] border border-cyan-200 bg-cyan-100/90 shadow-[0_10px_24px_rgba(34,211,238,0.18)]">
              <Brain className="h-10 w-10 text-cyan-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-black leading-snug tracking-tight text-slate-950">아직 오늘 측정을 하지 않았어요</div>
              <div className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">
                중요한 일 시작 전에
                <br />
                오늘의 집중력 리듬을 먼저 확인해보세요.
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => {
                SoundManager.playClick();
                onStart();
              }}
              className="inline-flex items-center rounded-full bg-cyan-500 px-5 py-2 text-[13px] font-black text-white shadow-[0_8px_18px_rgba(6,182,212,0.28)]"
            >
              지금 바로 시작
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-1 text-[12px] font-bold text-slate-500">오늘의 집중력 지수</div>
          <div className="mb-1 text-[36px] font-black tracking-tighter" style={{ color: grade.color }}>
            {todayResult.score.toLocaleString()}
          </div>
          <div className="inline-block rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[12px] font-extrabold text-slate-800 shadow-sm">
            {`${grade.label} 등급`}
          </div>
          <div className="mt-1 text-[12px] font-bold text-slate-600">{grade.name}</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-black text-blue-700 shadow-sm">
              {decisionBundle.workStyle}
            </span>
            <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-black text-slate-700 shadow-sm">
              {decisionBundle.focusAge}
            </span>
          </div>
          {rankSnapshot ? (
            <div className="mt-3 flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[11px] font-extrabold text-cyan-700">
              <Trophy className="h-3.5 w-3.5" />
              {`상위 ${rankSnapshot.topPercent}% 기록`}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DailyBriefCard({ brief, predictiveAlert, rankSnapshot, streak, assetStatus, skipCost }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">DAILY BRIEF</div>
        <div className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700">오늘만 유효</div>
      </div>
      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
        <div className="text-[10px] font-black text-rose-600">{skipCost.title}</div>
        <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-700">{skipCost.body}</div>
      </div>
      <div className="mt-2 text-[18px] font-black leading-snug text-slate-900">{brief.headline}</div>
      <div className="mt-1.5 text-[14px] font-semibold leading-relaxed text-slate-600">{brief.summary}</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
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
      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-100/70 px-3 py-2.5">
        <div className="text-[10px] font-black text-blue-700">{predictiveAlert.title}</div>
        <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-700">{brief.footer}</div>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
        <div className="text-[10px] font-black text-slate-500">예측 정확도</div>
        <div className="text-[11px] font-black text-slate-900">{`${assetStatus.accuracy.percent}% · ${assetStatus.accuracy.label}`}</div>
      </div>
    </div>
  );
}

function ActionSummaryCard({ decisionBundle, recommendation, recommendedTime, dailyTheme, coachRecommendation }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-extrabold tracking-[0.16em] text-blue-700">TODAY ACTION</div>
        <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-blue-700 shadow-sm">
          {recommendedTime.label}
        </div>
      </div>
      <div className="mt-2 text-[17px] font-black leading-snug text-slate-900">{decisionBundle.firstActionTitle}</div>
      <div className="mt-1.5 text-[13px] font-semibold leading-relaxed text-slate-700">{decisionBundle.firstActionBody}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-blue-700 shadow-sm">{coachRecommendation.label}</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm">{decisionBundle.bestSlot}</span>
      </div>
      <div className="mt-3 grid gap-2">
        <div className="rounded-xl bg-white/80 px-3 py-2.5">
          <div className="text-[10px] font-black text-blue-700">추천</div>
          <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">
            {recommendation.recommended.slice(0, 2).join(" · ")}
          </div>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2.5">
          <div className="text-[10px] font-black text-rose-600">비추천</div>
          <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-700">
            {recommendation.discouraged.slice(0, 2).join(" · ")}
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-blue-200 bg-white/80 px-3 py-2.5">
        <div className="text-[10px] font-black text-blue-700">{dailyTheme.badge}</div>
        <div className="mt-1 text-[12px] font-black text-slate-900">{dailyTheme.title}</div>
        <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{dailyTheme.body}</div>
      </div>
    </div>
  );
}

function PatternCard({ slotAnalysis, assetStatus }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 shadow-sm">
      <div className="text-[12px] font-extrabold tracking-[0.16em] text-blue-700">TIME PATTERN</div>
      <div className="mt-2 text-[17px] font-black leading-snug text-slate-900">{slotAnalysis.profileLabel}</div>
      <div className="mt-1.5 text-[14px] font-semibold leading-relaxed text-slate-700">{slotAnalysis.summary}</div>
      <div className="mt-3 grid gap-2">
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

function CoachEntryCard({ onOpen, recommendation }) {
  return (
    <button
      onClick={() => {
        SoundManager.playClick();
        onOpen(recommendation.tab);
      }}
      className="group flex h-full w-full flex-col justify-between rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-4 text-left shadow-sm transition-all hover:bg-blue-50 active:scale-[0.99]"
    >
      <div>
        <div className="flex items-center text-[17px] font-black text-slate-900">
          <Sparkles className="mr-2 h-[18px] w-[18px] text-blue-600" />
          오늘의 집중 코치
        </div>
        <div className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1.5 text-[11px] font-black text-blue-700">
          {`추천: ${recommendation.label}`}
        </div>
        <div className="mt-2 text-[14px] font-semibold leading-[1.5] text-slate-500">
          {recommendation.title}
          <br />
          {recommendation.body}
        </div>
      </div>
      <div className="mt-4 flex items-center text-[14px] font-extrabold text-blue-700">
        코치 열기
        <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

export function HomeScreen({ onStart, onCoach, dataService }) {
  const scrollRef = useRef(null);
  const { todayResult, isTodayDone, streak, diffFromYesterday, rankSnapshot } = dataService;
  const grade = isTodayDone ? getGrade(todayResult.score) : null;
  const patternSnapshot = getTimePattern(dataService.data.records || []);
  const slotAnalysis = getTimeSlotAnalysis(dataService.data.records || []);
  const recommendedTime = getRecommendedMeasurementTime(dataService.data.records || []);
  const coachRecommendation = getCoachRecommendation(todayResult);
  const taskRecommendation = getTaskRecommendation(todayResult);
  const dailyTheme = getDailyTheme();
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

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-50 px-5 pb-3 pt-4 text-slate-900"
      onClick={() => SoundManager.init()}
    >
      <header className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ArrowUp className="h-7 w-7 text-cyan-600" />
          <span className="text-[34px] font-black tracking-tight text-slate-950">오르락</span>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[16px] font-extrabold text-slate-700 shadow-sm">
          {todayStr}
        </span>
      </header>

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pb-4">
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
          decisionBundle={decisionBundle}
          onStart={onStart}
        />

        {diffFromYesterday !== null && isTodayDone ? (
          <div className={`-mt-1 text-center text-xs font-extrabold ${diffFromYesterday >= 0 ? "text-cyan-600" : "text-rose-600"}`}>
            {`어제보다 ${diffFromYesterday >= 0 ? "↑" : "↓"} ${Math.abs(diffFromYesterday).toLocaleString()}점`}
          </div>
        ) : null}

        <DailyBriefCard
          brief={dailyBrief}
          predictiveAlert={predictiveAlert}
          rankSnapshot={rankSnapshot}
          streak={streak}
          assetStatus={assetStatus}
          skipCost={skipCost}
        />

        <ActionSummaryCard
          decisionBundle={decisionBundle}
          recommendation={taskRecommendation}
          recommendedTime={recommendedTime}
          dailyTheme={dailyTheme}
          coachRecommendation={coachRecommendation}
        />

        <CoachEntryCard onOpen={onCoach} recommendation={coachRecommendation} />
      </div>
    </div>
  );
}
