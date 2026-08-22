import React, { useState } from "react";
import { Brain, ChevronLeft, Sparkles, Trophy } from "lucide-react";
import { buildWeeklyContext } from "../lib/measureBattery";
import {
  getBadgeCollection,
  getFocusGrowth,
  getFocusRiskAlert,
  getNextChallengeMilestone,
  getPatternForecast,
  getRevisitReason,
  getTimePattern,
  getTimeSlotAnalysis,
  getWeeklyAiSummary,
} from "../lib/progression";
import { getAssetStatus, getCollectionProgress } from "../lib/engagement";
import { SoundManager } from "../lib/soundManager";
import { getGrade } from "../lib/scoring";

function MiniHint({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

function getPatternConfidence(measuredDays) {
  if (measuredDays >= 21) return "높음";
  if (measuredDays >= 10) return "상승 중";
  if (measuredDays >= 5) return "보통";
  return "수집 중";
}

function getStageKoreanLabel(stageId) {
  if (stageId === "reaction") return "반응 속도";
  if (stageId === "focus") return "선택적 주의";
  if (stageId === "flow") return "지속 집중";
  return "데이터 수집 중";
}

export function RecordScreen({ onBack, dataService, engine, onReplayOnboarding }) {
  const { weekRecords, data, streak, stats, challenge, levelInfo, rankSnapshot } = dataService;
  const validRecords = weekRecords.filter(Boolean);
  const weeklyContext = buildWeeklyContext(validRecords);
  const timePattern = getTimePattern(data.records || []);
  const slotAnalysis = getTimeSlotAnalysis(data.records || []);
  const patternForecast = getPatternForecast(data.records || []);
  const nextMilestone = getNextChallengeMilestone(streak);
  const growth = getFocusGrowth(data.records || []);
  const riskAlert = getFocusRiskAlert(data.records || []);
  const weeklySummary = getWeeklyAiSummary(data.records || []);
  const assetStatus = getAssetStatus({
    measuredDays: stats.measuredDays,
    streak,
    challenge,
    levelInfo,
    records: data.records || [],
  });
  const revisitReason = getRevisitReason({
    isTodayDone: dataService.isTodayDone,
    streak,
    challenge,
    patternSnapshot: timePattern,
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

  const ageGroupAvg = {
    "20대": 3200,
    "30대": 2800,
    "40대": 2200,
    "50대": 1600,
    "60대": 1100,
  }[data.profile.preferredAgeGroup || "30대"];

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
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-slate-50 px-4 pb-5 pt-4 text-slate-900">
      <header className="mb-4 flex items-center pt-1">
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

      <div className="mb-4 rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-md">
        <div className="mb-3 flex justify-between text-center">
          <div className="flex-1">
            <div className="mb-1 text-[1.8rem] font-black text-cyan-600">{stats.weekAvg.toLocaleString()}</div>
            <div className="text-[12px] font-extrabold text-slate-500">이번 주 평균</div>
          </div>
          <div className="mx-2 w-px bg-slate-200" />
          <div className="flex-1">
            <div className="mb-1 text-[1.8rem] font-black text-slate-900">{stats.best.toLocaleString()}</div>
            <div className="text-[12px] font-extrabold text-slate-500">최고 기록</div>
          </div>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-3 text-center">
          <div className="flex-1">
            <div className="mb-1 text-[1.45rem] font-black text-cyan-600">{`${streak}일`}</div>
            <div className="text-[11px] font-extrabold text-slate-500">연속 측정</div>
          </div>
          <div className="mx-2 w-px bg-slate-200" />
          <div className="flex-1">
            <div className="mb-1 text-[1.45rem] font-black text-cyan-600">{stats.bestDay}</div>
            <div className="text-[11px] font-extrabold text-slate-500">최고의 요일</div>
          </div>
          <div className="mx-2 w-px bg-slate-200" />
          <div className="flex-1">
            <div className="mb-1 text-[1.45rem] font-black text-cyan-600">{stats.bestTime}</div>
            <div className="text-[11px] font-extrabold text-slate-500">최적의 시간대</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniHint label="자산 지수" value={`${assetStatus.assetScore}점`} />
          <MiniHint label="예측 정확도" value={`${assetStatus.accuracy.percent}%`} />
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] font-semibold leading-relaxed text-slate-700">
          {assetStatus.moat}
        </div>
      </div>

      <div className="mb-4 grid gap-2.5">
        <div className="rounded-[1.6rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">FOCUS LEVEL</div>
            <div className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-black text-cyan-700">{`Lv.${levelInfo.level}`}</div>
          </div>
          <div className="mt-2 text-[15px] font-black text-slate-900">{levelInfo.title}</div>
          <div className="mt-1 text-[13px] font-semibold text-slate-700">
            {challenge.completed ? "7일 챌린지를 달성했고, 이제는 유지 구간입니다." : `7일 챌린지 ${challenge.current}/${challenge.target} 진행 중이에요.`}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
            <div className="h-full rounded-full bg-cyan-400" style={{ width: `${levelInfo.progressPct}%` }} />
          </div>
        </div>

        {rankSnapshot ? (
          <div className="rounded-[1.6rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
            <div className="flex items-center text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">
              <Trophy className="mr-1.5 h-4 w-4" />
              RANK SNAPSHOT
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <MiniHint label="상위" value={`${rankSnapshot.topPercent}%`} />
              <MiniHint label="내 최고" value={rankSnapshot.allTimeBest.toLocaleString()} />
              <MiniHint label="기록 일수" value={`${stats.measuredDays}일`} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mb-4 rounded-[1.6rem] border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500">MY FOCUS ASSET</div>
        <div className="mt-2 text-[15px] font-black text-slate-900">기록이 쌓일수록 오르락이 더 정확해집니다</div>
        <div className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-600">
          시간대 패턴, 업무 추천, 위험 경고는 모두 내 기록이 늘어날수록 더 개인화됩니다.
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MiniHint label="기록 일수" value={`${stats.measuredDays}일`} />
          <MiniHint label="패턴 신뢰도" value={getPatternConfidence(stats.measuredDays)} />
          <MiniHint label="추천 정확도" value={stats.measuredDays >= 7 ? "개인화됨" : "학습 중"} />
        </div>
      </div>

      <h3 className="mb-3 ml-1 text-base font-extrabold text-slate-800">주간 흐름</h3>
      <div className="relative mb-4 flex h-52 items-end justify-between rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-md">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-4 py-4 opacity-40">
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
            <div key={`${record?.date || "empty"}-${index}`} className="relative z-10 flex w-8 flex-col items-center">
              <div className="mb-1 h-4 text-[11px] font-extrabold" style={{ color: grade?.color || "#9ca3af" }}>
                {record ? grade.label : ""}
              </div>
              <div className="flex h-32 w-full items-end justify-center overflow-hidden rounded-md bg-slate-100">
                <div
                  className="w-full rounded-t-md transition-all duration-1000 ease-out"
                  style={{ height: `${height}%`, backgroundColor: grade?.color || "#e5e7eb" }}
                />
              </div>
              <div className={`mt-2.5 text-[11px] font-extrabold ${index === 6 ? "text-cyan-600" : "text-slate-500"}`}>
                {index === 6 ? "오늘" : dayLabel}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-4 rounded-[1.6rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">PATTERN GUIDE</div>
        <div className="mt-3 grid gap-2">
          <MiniHint label="이번 주 강점" value={getStageKoreanLabel(weeklyContext.bestStageId)} />
          <MiniHint label="이번 주 보완" value={getStageKoreanLabel(weeklyContext.weakestStageId)} />
          <MiniHint label="가장 강한 시간대" value={timePattern.bestTimeOfDay} />
          <MiniHint
            label="다음 목표"
            value={streak >= 3 ? "현재 리듬 유지하기" : "3일 연속 측정 만들기"}
          />
        </div>
      </div>

      <div className="mb-4 rounded-[1.6rem] border border-sky-200 bg-sky-50 p-3.5 shadow-sm">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-sky-700">PATTERN FORECAST</div>
        <div className="mt-2 text-base font-black text-slate-900">{patternForecast.profile}</div>
        <div className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{patternForecast.summary}</div>
        <div className="mt-3 grid gap-2">
          <MiniHint label="자주 흔들리는 조건" value={patternForecast.risk} />
          <MiniHint label="다음에 살릴 기회" value={patternForecast.opportunity} />
          <MiniHint
            label="다음 챌린지 마일스톤"
            value={nextMilestone.completedAll ? "30일 이상 유지 중" : `${nextMilestone.next}일까지 ${nextMilestone.remaining}일`}
          />
        </div>
      </div>

      <div className="mb-4 rounded-[1.6rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">TIME SLOT ANALYSIS</div>
        <div className="mt-2 text-[15px] font-black text-slate-900">{slotAnalysis.profileLabel}</div>
        <div className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">{slotAnalysis.summary}</div>
        <div className="mt-3 grid gap-2">
          {slotAnalysis.slots.slice(0, 5).map((slot) => (
            <MiniHint key={slot.label} label={`${slot.label} · ${slot.status}`} value={slot.average ? `${slot.average}점` : "-"} />
          ))}
        </div>
      </div>

      <div
        className={`mb-4 rounded-[1.6rem] border p-3.5 shadow-sm ${
          riskAlert.level === "warn" ? "border-rose-200 bg-rose-50" : "border-cyan-200 bg-cyan-50"
        }`}
      >
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-700">FOCUS RISK ALERT</div>
        <div className="mt-2 text-[15px] font-black text-slate-900">{riskAlert.title}</div>
        <div className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">{riskAlert.body}</div>
      </div>

      <div className="mb-4 rounded-[1.6rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">SMART INSIGHT</div>
        <div className="mt-2 text-[13px] font-semibold leading-relaxed text-slate-700">{revisitReason}</div>
        <div className="mt-3 grid gap-2">
          <MiniHint label="이번 주 최고" value={weeklySummary.bestMoment} />
          <MiniHint label="강점 / 약점" value={`${weeklySummary.strength} / ${weeklySummary.weakness}`} />
          <MiniHint label="성장 흐름" value={growth.summary} />
          <MiniHint
            label="ROI"
            value={
              growth.previousAvg
                ? `${growth.previousAvg.toLocaleString()} → ${growth.recentAvg.toLocaleString()}`
                : `${growth.recentAvg.toLocaleString()}점`
            }
          />
        </div>
      </div>

      <h3 className="mb-3 ml-1 text-base font-extrabold text-slate-800">{`${data.profile.preferredAgeGroup || "30대"} 평균 비교`}</h3>
      <div className="mb-4 rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-600">내 평균</span>
          <span className="text-[1.7rem] font-black text-cyan-600">{stats.weekAvg.toLocaleString()}</span>
        </div>
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-600">{`${data.profile.preferredAgeGroup || "30대"} 평균`}</span>
          <span className="text-[1.7rem] font-black text-slate-900">{ageGroupAvg.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3.5 text-center text-sm font-extrabold text-cyan-700">
          {stats.weekAvg > ageGroupAvg
            ? `${data.profile.preferredAgeGroup || "30대"} 평균보다 ${(((stats.weekAvg / ageGroupAvg) - 1) * 100).toFixed(0)}% 높아요.`
            : `${data.profile.preferredAgeGroup || "30대"} 평균까지 ${(ageGroupAvg - stats.weekAvg).toLocaleString()}점 남았어요.`}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="mb-3 ml-1 flex items-center text-base font-extrabold text-slate-800">
          <Trophy className="mr-1.5 h-5 w-5 text-amber-500" />
          배지 모아보기
        </h3>
        <div className="mb-3 rounded-[1.6rem] border border-amber-200 bg-amber-50 p-3.5 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-amber-700">COLLECTION PROGRESS</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-black text-slate-900">{`${collection.unlocked}/${collection.total} 배지 해금`}</div>
              <div className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">
                {collection.nextBadge ? `다음 목표: ${collection.nextBadge.label}` : "모든 배지를 모았어요"}
              </div>
            </div>
            <div className="rounded-full bg-white px-3 py-1.5 text-[12px] font-black text-amber-700 shadow-sm">{`${collection.percent}%`}</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${collection.percent}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-2xl border px-3 py-4 text-center shadow-sm ${
                badge.unlocked ? "border-amber-200 bg-white" : "border-slate-200 bg-slate-100 opacity-70"
              }`}
            >
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xs font-black ${
                  badge.unlocked ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"
                }`}
              >
                {badge.shortLabel}
              </div>
              <div className="mt-2 text-[12px] font-black text-slate-900">{badge.label}</div>
              <div className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">{badge.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="mb-3 ml-1 flex items-center text-base font-extrabold text-slate-800">
          <Sparkles className="mr-1.5 h-5 w-5 text-cyan-600" />
          주간 인사이트
        </h3>

        {!weeklyReport ? (
          <button
            onClick={handleWeeklyReport}
            disabled={isLoading || validRecords.length === 0}
            className="flex w-full items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 py-4 text-[15px] font-extrabold text-cyan-700 shadow-sm transition-all hover:bg-cyan-100 disabled:opacity-50"
          >
            {isLoading
              ? "분석 중..."
              : validRecords.length === 0
                ? "기록이 없어 분석할 수 없어요"
                : "나의 주간 집중 패턴 분석하기"}
          </button>
        ) : (
          <div className="relative rounded-[1.7rem] border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
            <div className="absolute right-5 top-5 text-cyan-200">
              <Brain className="h-12 w-12" />
            </div>
            <div className="relative z-10 whitespace-pre-wrap pr-10 text-sm font-semibold leading-relaxed text-slate-800">
              {weeklyReport}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 rounded-[1.6rem] border border-cyan-200 bg-cyan-50 p-3.5 shadow-sm">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-700">ONBOARDING</div>
        <div className="mt-2 text-[15px] font-black text-slate-900">앱 가치 다시 보기</div>
        <div className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">
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

      <div className="mb-4 rounded-[1.6rem] border border-rose-200 bg-rose-50 p-3.5 shadow-sm">
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-rose-700">RESET</div>
        <div className="mt-2 text-[15px] font-black text-slate-900">기록 다시 시작</div>
        <div className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-700">
          오늘 기록만 지우거나, 전체 측정 데이터를 초기화할 수 있습니다. 전체 초기화는 레벨, 챌린지, 배지까지 함께 다시 시작됩니다.
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

      {resetTarget ? (
        <div className="absolute inset-0 z-40 flex items-end bg-slate-950/35 p-4 backdrop-blur-[1px]">
          <div className="w-full rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-rose-700">CONFIRM</div>
            <div className="mt-2 text-[16px] font-black text-slate-950">
              {resetTarget === "today" ? "오늘 기록을 삭제할까요?" : "전체 데이터를 초기화할까요?"}
            </div>
            <div className="mt-2 text-[13px] font-semibold leading-relaxed text-slate-600">
              {resetTarget === "today"
                ? "오늘 점수와 오늘 비교 기록이 사라지고, 연속 측정 상태도 다시 계산됩니다."
                : "측정 기록, 레벨, 챌린지, 배지가 모두 초기화됩니다. 연령대 설정은 유지됩니다."}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  SoundManager.playClick();
                  setResetTarget(null);
                }}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-[13px] font-extrabold text-slate-700"
              >
                취소
              </button>
              <button
                onClick={handleResetConfirm}
                className="rounded-xl border border-rose-300 bg-rose-500 px-3 py-3 text-[13px] font-extrabold text-white"
              >
                {resetTarget === "today" ? "오늘 기록 삭제" : "전체 초기화"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
