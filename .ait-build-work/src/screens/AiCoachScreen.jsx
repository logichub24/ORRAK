import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Rocket, ShieldAlert, Sparkles } from "lucide-react";
import {
  getFocusRoutine,
  getRecommendedMeasurementTime,
  getRevisitReason,
  getSkipCostMessage,
  getTaskPriorityRecommendation,
  getTimePattern,
  getWorkStyleRecommendation,
} from "../lib/progression";
import { getAssetStatus, getDailyTheme } from "../lib/engagement";
import { SoundManager } from "../lib/soundManager";
import { getGrade } from "../lib/scoring";

function ResultBox({ title, tone, value, onReset }) {
  const toneMap = {
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    rose: "bg-rose-50 border-rose-200 text-rose-800",
  };

  return (
    <div className={`flex min-h-[180px] flex-col rounded-2xl border p-3.5 ${toneMap[tone] || toneMap.cyan}`}>
      <div className="mb-3 flex items-start justify-between">
        <div className="text-[16px] font-extrabold">{title}</div>
        <button onClick={onReset} className="text-xl font-bold leading-none opacity-70">
          ×
        </button>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-slate-800">
        {value}
      </div>
    </div>
  );
}

function InsightTile({ title, body, tone = "slate" }) {
  const toneMap = {
    cyan: "border-cyan-200 bg-cyan-50",
    rose: "border-rose-200 bg-rose-50",
    slate: "border-slate-200 bg-slate-50",
  };

  return (
    <div className={`rounded-2xl border px-3.5 py-3 ${toneMap[tone]}`}>
      <div className="text-[12px] font-extrabold tracking-[0.14em] text-slate-700">{title}</div>
      <div className="mt-1.5 text-[15px] font-semibold leading-relaxed text-slate-700">{body}</div>
    </div>
  );
}

const QUICK_STARTS = [
  ["schedule", "25분 계획"],
  ["mood", "컨디션 점검"],
  ["distraction", "방해 차단"],
];

export function AiCoachScreen({ onBack, engine, dataService, initialTab = "schedule" }) {
  const { todayResult, isTodayDone, streak, challenge, dailyTip } = dataService;
  const [activeTab, setActiveTab] = useState(initialTab);

  const [dailyMission, setDailyMission] = useState(null);
  const [boosterMsg, setBoosterMsg] = useState(null);
  const [aiSchedule, setAiSchedule] = useState(null);
  const [aiSolution, setAiSolution] = useState(null);
  const [aiKickstart, setAiKickstart] = useState(null);

  const [userMood, setUserMood] = useState("");
  const [tasks, setTasks] = useState("");
  const [distraction, setDistraction] = useState("");
  const [dreadedTask, setDreadedTask] = useState("");

  const [loading, setLoading] = useState({
    tip: false,
    mood: false,
    schedule: false,
    distraction: false,
    kickstart: false,
  });

  const tabs = useMemo(
    () => [
      ["schedule", "할 일 쪼개기", "오늘 해야 할 일을 집중 흐름에 맞는 시간 블록으로 나누어드립니다."],
      ["kickstart", "미루기 극복", "시작이 막히는 일을 바로 움직일 수 있게 첫 행동과 초안을 정리합니다."],
      ["mood", "컨디션 코칭", "현재 상태에 맞는 짧은 집중 코칭으로 측정 전 흐름을 맞춥니다."],
      ["tip", "5분 팁", "바로 실천할 수 있는 짧은 회복 팁을 드립니다."],
      ["distraction", "방해 차단", "집중력을 깨는 원인을 빠르게 줄일 수 있는 실전 조치를 제안합니다."],
    ],
    []
  );

  const setLoadingState = (key, value) => setLoading((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab) => {
    SoundManager.playTab();
    setActiveTab(tab);
  };

  const runAction = async (key, action) => {
    SoundManager.playAI();
    setLoadingState(key, true);
    try {
      await action();
      SoundManager.playSuccess();
    } finally {
      setLoadingState(key, false);
    }
  };

  const activeInfo = tabs.find(([key]) => key === activeTab);
  const patternSnapshot = getTimePattern(dataService.data.records || []);
  const recommendedTime = getRecommendedMeasurementTime(dataService.data.records || []);
  const routine = getFocusRoutine(todayResult, dataService.data.records || []);
  const assetStatus = getAssetStatus({
    measuredDays: dataService.stats.measuredDays,
    streak,
    challenge,
    levelInfo: dataService.levelInfo,
    records: dataService.data.records || [],
  });
  const revisitReason = getRevisitReason({
    isTodayDone,
    streak,
    challenge,
    patternSnapshot,
  });
  const skipCost = getSkipCostMessage({
    isTodayDone,
    streak,
    challenge,
    recommendedTime,
  });
  const workStyle = getWorkStyleRecommendation(todayResult);
  const taskPriority = getTaskPriorityRecommendation(tasks, todayResult);
  const dailyTheme = getDailyTheme();

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-slate-50 px-4 pb-5 pt-4 text-slate-900">
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
        <div className="ml-2">
          <div className="text-[2rem] font-black leading-tight">오늘의 집중 코치</div>
          <div className="mt-1.5 text-[14px] font-semibold leading-relaxed text-slate-500">
            지금 필요한 집중 코칭 기능을 고르면 바로 실행 단계까지 이어집니다.
          </div>
        </div>
      </header>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 text-[12px] font-extrabold tracking-[0.16em] text-cyan-700">COACH MENU</div>
        <div className="grid grid-cols-2 gap-1.5">
          {tabs.map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`rounded-2xl border px-3 py-2 text-left transition-all ${
                activeTab === tab ? "border-cyan-200 bg-cyan-50 text-slate-950 shadow-sm" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <div className="text-[16px] font-black">{label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 text-[12px] font-extrabold tracking-[0.16em] text-cyan-700">QUICK START</div>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {QUICK_STARTS.map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className="rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2.5 text-[13px] font-black text-cyan-700 transition-colors hover:bg-cyan-100"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mb-2 rounded-xl bg-cyan-50 px-3 py-2.5 text-[14px] font-semibold leading-relaxed text-cyan-800">
          지금 흐름에서 가장 먼저 실행할 코치를 고르고, 바로 행동으로 이어지게 짧게 설계했습니다.
        </div>
        <div className="text-[12px] font-extrabold tracking-[0.16em] text-slate-500">선택한 코치</div>
        <div className="mt-1 text-[18px] font-black text-slate-900">{activeInfo?.[1]}</div>
        <div className="mt-1.5 text-[14px] font-semibold leading-relaxed text-slate-500">{activeInfo?.[2]}</div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <InsightTile title="TODAY TIP" body={dailyTip} tone="cyan" />
        <InsightTile title="DON'T MISS TODAY" body={skipCost.body || revisitReason} tone="rose" />
      </div>

      <div className="mb-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 shadow-sm">
        <div className="text-[12px] font-extrabold tracking-[0.16em] text-cyan-700">{dailyTheme.badge}</div>
        <div className="mt-2 text-[18px] font-black text-slate-900">{dailyTheme.title}</div>
        <div className="mt-1.5 text-[14px] font-semibold leading-relaxed text-slate-700">{dailyTheme.body}</div>
      </div>

      <div className="mb-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 shadow-sm">
        <div className="text-[12px] font-extrabold tracking-[0.16em] text-cyan-700">FOCUS ROUTINE</div>
        <div className="mt-2 text-[18px] font-black text-slate-900">{routine.title}</div>
        <div className="mt-2 text-[14px] font-semibold leading-relaxed text-slate-700">{routine.steps.join(" → ")}</div>
        <div className="mt-2 text-[13px] font-bold text-slate-500">{`오늘 업무 유형 추천: ${workStyle.type}`}</div>
      </div>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="text-[12px] font-extrabold tracking-[0.16em] text-slate-500">FOCUS ASSET</div>
        <div className="mt-2 text-[17px] font-black text-slate-900">{`예측 정확도 ${assetStatus.accuracy.percent}%`}</div>
        <div className="mt-1 text-[14px] font-semibold leading-relaxed text-slate-600">{assetStatus.moat}</div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-black text-slate-500">자산 지수</div>
            <div className="mt-1 text-[12px] font-black text-slate-900">{`${assetStatus.assetScore}점`}</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-black text-slate-500">강한 시간</div>
            <div className="mt-1 text-[12px] font-black text-slate-900">{patternSnapshot.bestTimeOfDay}</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-black text-slate-500">다음 해금</div>
            <div className="mt-1 text-[12px] font-black text-slate-900">{assetStatus.nextUnlock}</div>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-[13px] font-semibold leading-relaxed text-cyan-800">
          {revisitReason}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
        {activeTab === "schedule" && (
          !aiSchedule ? (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-bold leading-relaxed text-slate-600">
                오늘 할 일을 적어보세요. 현재 집중력에 맞춰 시간 블록으로 나눌게요.
              </div>
              <textarea
                value={tasks}
                onChange={(event) => setTasks(event.target.value)}
                placeholder="예: 인강 30분, 방 정리, 메일 답장"
                className="min-h-[96px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
              {tasks.trim() ? (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5">
                  <div className="text-[10px] font-black tracking-[0.16em] text-cyan-700">WORK COACH</div>
                  <div className="mt-2 text-[12px] font-semibold leading-relaxed text-slate-700">{taskPriority.summary}</div>
                  <div className="mt-2 grid gap-2">
                    {taskPriority.ordered.slice(0, 3).map((item) => (
                      <div key={`${item.rank}-${item.task}`} className="rounded-lg bg-white/80 px-3 py-2">
                        <div className="text-[12px] font-black text-slate-900">{`${item.rank}순위 ${item.task}`}</div>
                        <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{item.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                disabled={loading.schedule || !tasks.trim()}
                onClick={() =>
                  runAction("schedule", async () => {
                    const gradeLabel = isTodayDone ? getGrade(todayResult.score).label : "B";
                    const response = await engine.getSchedule(tasks, gradeLabel);
                    setAiSchedule(response);
                    setTasks("");
                  })
                }
                className="flex items-center justify-center rounded-xl border border-cyan-200 bg-cyan-100 py-3 text-sm font-extrabold text-cyan-700 shadow-sm transition-colors hover:bg-cyan-200 disabled:opacity-50"
              >
                <Sparkles className="mr-1.5 h-5 w-5" />
                {loading.schedule ? "분석 중..." : "맞춤 계획 받기"}
              </button>
            </div>
          ) : (
            <ResultBox title="맞춤 스케줄" tone="cyan" value={aiSchedule} onReset={() => setAiSchedule(null)} />
          )
        )}

        {activeTab === "kickstart" && (
          !aiKickstart ? (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-bold leading-relaxed text-slate-600">
                미루고 있는 일이 있다면 첫 행동과 초안을 바로 만들어드릴게요.
              </div>
              <textarea
                value={dreadedTask}
                onChange={(event) => setDreadedTask(event.target.value)}
                placeholder="예: 일정 연기 메일 보내기"
                className="min-h-[96px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
              <button
                disabled={loading.kickstart || !dreadedTask.trim()}
                onClick={() =>
                  runAction("kickstart", async () => {
                    const response = await engine.getKickstart(dreadedTask);
                    setAiKickstart(response);
                    setDreadedTask("");
                  })
                }
                className="flex items-center justify-center rounded-xl border border-cyan-200 bg-cyan-100 py-3 text-sm font-extrabold text-cyan-700 shadow-sm transition-colors hover:bg-cyan-200 disabled:opacity-50"
              >
                <Rocket className="mr-1.5 h-5 w-5" />
                {loading.kickstart ? "정리 중..." : "첫 행동 받기"}
              </button>
            </div>
          ) : (
            <ResultBox title="실행력 부스터" tone="cyan" value={aiKickstart} onReset={() => setAiKickstart(null)} />
          )
        )}

        {activeTab === "mood" && (
          !boosterMsg ? (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-bold leading-relaxed text-slate-600">측정 전 현재 컨디션을 짧게 적어주세요.</div>
              <input
                value={userMood}
                onChange={(event) => setUserMood(event.target.value)}
                placeholder="예: 잠이 부족함, 커피를 많이 마심"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && userMood.trim()) {
                    event.preventDefault();
                    runAction("mood", async () => {
                      const response = await engine.getBooster(userMood);
                      setBoosterMsg(response);
                      setUserMood("");
                    });
                  }
                }}
              />
              <button
                disabled={loading.mood || !userMood.trim()}
                onClick={() =>
                  runAction("mood", async () => {
                    const response = await engine.getBooster(userMood);
                    setBoosterMsg(response);
                    setUserMood("");
                  })
                }
                className="flex items-center justify-center rounded-xl border border-cyan-200 bg-cyan-100 py-3 text-sm font-extrabold text-cyan-700 shadow-sm transition-colors hover:bg-cyan-200 disabled:opacity-50"
              >
                <Sparkles className="mr-1.5 h-5 w-5" />
                {loading.mood ? "분석 중..." : "코칭 받기"}
              </button>
            </div>
          ) : (
            <ResultBox title="컨디션 코칭" tone="blue" value={boosterMsg} onReset={() => setBoosterMsg(null)} />
          )
        )}

        {activeTab === "tip" && (
          !dailyMission ? (
            <button
              disabled={loading.tip}
              onClick={() =>
                runAction("tip", async () => {
                  const response = await engine.getTip();
                  setDailyMission(response);
                })
              }
              className="flex min-h-[150px] w-full items-center justify-center rounded-xl border border-cyan-200 bg-cyan-100 py-4 text-sm font-extrabold text-cyan-700 shadow-sm transition-colors hover:bg-cyan-200 disabled:opacity-50"
            >
              <Sparkles className="mr-1.5 h-5 w-5" />
              {loading.tip ? "불러오는 중..." : "지금 바로 실천할 5분 팁"}
            </button>
          ) : (
            <ResultBox title="5분 팁" tone="cyan" value={dailyMission} onReset={() => setDailyMission(null)} />
          )
        )}

        {activeTab === "distraction" && (
          !aiSolution ? (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-bold leading-relaxed text-slate-600">
                지금 집중을 깨는 가장 큰 원인을 적어보세요.
              </div>
              <input
                value={distraction}
                onChange={(event) => setDistraction(event.target.value)}
                placeholder="예: 스마트폰, 주변 소음, 알림"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && distraction.trim()) {
                    event.preventDefault();
                    runAction("distraction", async () => {
                      const response = await engine.getSolution(distraction);
                      setAiSolution(response);
                      setDistraction("");
                    });
                  }
                }}
              />
              <button
                disabled={loading.distraction || !distraction.trim()}
                onClick={() =>
                  runAction("distraction", async () => {
                    const response = await engine.getSolution(distraction);
                    setAiSolution(response);
                    setDistraction("");
                  })
                }
                className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-100 py-3 text-sm font-extrabold text-rose-700 shadow-sm transition-colors hover:bg-rose-200 disabled:opacity-50"
              >
                <ShieldAlert className="mr-1.5 h-5 w-5" />
                {loading.distraction ? "정리 중..." : "차단법 받기"}
              </button>
            </div>
          ) : (
            <ResultBox title="차단 솔루션" tone="rose" value={aiSolution} onReset={() => setAiSolution(null)} />
          )
        )}
      </div>
    </div>
  );
}
