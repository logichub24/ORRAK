import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Rocket, ShieldAlert, Sparkles } from "lucide-react";
import {
  getRecommendedMeasurementTime,
  getSkipCostMessage,
  getTaskPriorityRecommendation,
  getWorkStyleRecommendation,
} from "../lib/progression";
import { getAssetStatus } from "../lib/engagement";
import { SoundManager } from "../lib/soundManager";
import { getGrade } from "../lib/scoring";

function ResultBox({ title, tone, value, onReset }) {
  const toneMap = {
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return (
    <div className={`flex min-h-[180px] flex-col rounded-2xl border p-3 ${toneMap[tone] || toneMap.cyan}`}>
      <div className="mb-2 flex items-start justify-between">
        <div className="text-[15px] font-extrabold">{title}</div>
        <button onClick={onReset} className="text-lg font-bold leading-none opacity-70">
          ×
        </button>
      </div>
      <div className="scrollbar-none reading-flow flex-1 overflow-y-auto whitespace-pre-wrap text-[14px] font-medium leading-relaxed text-slate-800">
        {value}
      </div>
    </div>
  );
}

function CoachMenuButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2 text-left transition-all ${
        active ? "border-cyan-200 bg-cyan-50 text-slate-950 shadow-sm" : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <div className="text-[14px] font-black leading-tight">{label}</div>
    </button>
  );
}

function CoachSegmentTabs({ activeSegment, onChange }) {
  const items = [
    { id: "action", label: "실행" },
    { id: "condition", label: "컨디션" },
    { id: "block", label: "방해 차단" },
  ];

  return (
    <div className="mb-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              SoundManager.playTab();
              onChange(item.id);
            }}
            className={`rounded-xl px-3 py-2 text-[12px] font-black transition-all ${
              activeSegment === item.id ? "bg-cyan-500 text-white shadow-sm" : "bg-slate-100 text-slate-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CoachFocusCard({ activeInfo, recommendedTime, workStyle, skipCost, accuracyLabel }) {
  const focusLabel =
    recommendedTime.label === "오전형 집중자" ? "오전형\n집중자" : recommendedTime.label;

  return (
    <div className="mb-2 rounded-2xl border border-cyan-200 bg-cyan-50 p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold tracking-[0.16em] text-cyan-700">COACH FOCUS</div>
          <div className="mt-1 text-[15px] font-black text-slate-950">{activeInfo?.label}</div>
          <div className="reading-flow mt-1 text-[11px] font-semibold leading-relaxed text-slate-700">{activeInfo?.description}</div>
        </div>
        <div className="min-w-[72px] whitespace-pre-line break-keep rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-center text-[11px] font-black leading-tight text-cyan-900 shadow-sm">
          {focusLabel}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <div className="rounded-xl bg-white/90 px-2.5 py-1.5">
          <div className="text-[10px] font-black text-slate-500">추천 시간</div>
          <div className="mt-1 text-[12px] font-black text-slate-900">{recommendedTime.window}</div>
        </div>
        <div className="rounded-xl bg-white/90 px-2.5 py-1.5">
          <div className="text-[10px] font-black text-slate-500">업무 유형</div>
          <div className="mt-1 text-[12px] font-black text-slate-900">{workStyle.type}</div>
        </div>
        <div className="rounded-xl bg-white/90 px-2.5 py-1.5">
          <div className="text-[10px] font-black text-slate-500">예측 정확도</div>
          <div className="mt-1 text-[12px] font-black text-slate-900">{accuracyLabel}</div>
        </div>
      </div>

      <div className="reading-flow mt-2 rounded-xl border border-cyan-200 bg-white/80 px-3 py-2 text-[10px] font-semibold leading-relaxed text-slate-700">
        {skipCost.body}
      </div>
    </div>
  );
}

const TAB_CONFIG = [
  {
    key: "schedule",
    segment: "action",
    label: "할 일 쪼개기",
    description: "오늘 해야 할 일을 지금 집중 흐름에 맞는 시간 블록으로 나눠드립니다.",
  },
  {
    key: "kickstart",
    segment: "action",
    label: "미루기 극복",
    description: "시작이 막히는 일을 바로 움직일 수 있게 첫 행동과 초안을 정리합니다.",
  },
  {
    key: "mood",
    segment: "condition",
    label: "컨디션 코칭",
    description: "현재 상태에 맞는 짧은 집중 코칭으로 측정 전 흐름을 맞춥니다.",
  },
  {
    key: "tip",
    segment: "condition",
    label: "5분 팁",
    description: "바로 실행할 수 있는 짧은 회복 팁을 드립니다.",
  },
  {
    key: "distraction",
    segment: "block",
    label: "방해 차단",
    description: "집중을 끊는 원인을 빠르게 줄일 수 있는 차단 방법을 제안합니다.",
  },
];

export function AiCoachScreen({ onBack, engine, dataService, initialTab = "schedule" }) {
  const { todayResult, isTodayDone, streak, challenge } = dataService;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSegment, setActiveSegment] = useState(() => {
    const found = TAB_CONFIG.find((item) => item.key === initialTab);
    return found?.segment || "action";
  });

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

  const setLoadingState = (key, value) => setLoading((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    setActiveTab(initialTab);
    const found = TAB_CONFIG.find((item) => item.key === initialTab);
    setActiveSegment(found?.segment || "action");
  }, [initialTab]);

  const segmentTabs = useMemo(
    () => ({
      action: TAB_CONFIG.filter((item) => item.segment === "action"),
      condition: TAB_CONFIG.filter((item) => item.segment === "condition"),
      block: TAB_CONFIG.filter((item) => item.segment === "block"),
    }),
    []
  );

  useEffect(() => {
    const availableTabs = segmentTabs[activeSegment].map((item) => item.key);
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeSegment, activeTab, segmentTabs]);

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

  const activeInfo = TAB_CONFIG.find((item) => item.key === activeTab);
  const recommendedTime = getRecommendedMeasurementTime(dataService.data.records || []);
  const assetStatus = getAssetStatus({
    measuredDays: dataService.stats.measuredDays,
    streak,
    challenge,
    levelInfo: dataService.levelInfo,
    records: dataService.data.records || [],
  });
  const skipCost = getSkipCostMessage({
    isTodayDone,
    streak,
    challenge,
    recommendedTime,
  });
  const workStyle = getWorkStyleRecommendation(todayResult);
  const taskPriority = getTaskPriorityRecommendation(tasks, todayResult);

  return (
    <div className="scrollbar-none flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-slate-50 px-4 pb-4 pt-4 text-slate-900">
      <header className="mb-2 flex items-center pt-1">
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
          <div className="text-[1.7rem] font-black leading-tight">오늘의 집중 코치</div>
          <div className="reading-flow mt-1 text-[12px] font-semibold leading-relaxed text-slate-500">
            지금 필요한 도움만 골라 짧게 입력하고 바로 실행 단계로 이어갑니다.
          </div>
        </div>
      </header>

      <CoachSegmentTabs activeSegment={activeSegment} onChange={setActiveSegment} />

      <div className="mb-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="mb-1.5 text-[11px] font-extrabold tracking-[0.16em] text-cyan-700">COACH MENU</div>
        <div className={`grid gap-1.5 ${activeSegment === "block" ? "grid-cols-1" : "grid-cols-2"}`}>
          {segmentTabs[activeSegment].map((item) => (
            <CoachMenuButton key={item.key} active={activeTab === item.key} label={item.label} onClick={() => handleTabChange(item.key)} />
          ))}
        </div>
      </div>

      <CoachFocusCard
        activeInfo={activeInfo}
        recommendedTime={recommendedTime}
        workStyle={workStyle}
        skipCost={skipCost}
        accuracyLabel={`${assetStatus.accuracy.percent}%`}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-md">
        {activeTab === "schedule" &&
          (!aiSchedule ? (
            <div className="flex flex-col gap-3">
              <div className="reading-flow text-sm font-bold leading-relaxed text-slate-600">
                오늘 해야 할 일을 적어보세요. 현재 집중력에 맞는 순서와 시간 블록으로 정리해드립니다.
              </div>
              <textarea
                value={tasks}
                onChange={(event) => setTasks(event.target.value)}
                placeholder="예: 인강 30분, 방 정리, 메일 답장"
                className="min-h-[92px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
              {tasks.trim() ? (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5">
                  <div className="text-[10px] font-black tracking-[0.16em] text-cyan-700">WORK COACH</div>
                  <div className="reading-flow mt-2 text-[12px] font-semibold leading-relaxed text-slate-700">{taskPriority.summary}</div>
                  <div className="mt-2 grid gap-2">
                    {taskPriority.ordered.slice(0, 3).map((item) => (
                      <div key={`${item.rank}-${item.task}`} className="rounded-lg bg-white/80 px-3 py-2">
                        <div className="text-[12px] font-black text-slate-900">{`${item.rank}순위 ${item.task}`}</div>
                        <div className="reading-flow mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{item.reason}</div>
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
            <ResultBox title="맞춤 계획" tone="cyan" value={aiSchedule} onReset={() => setAiSchedule(null)} />
          ))}

        {activeTab === "kickstart" &&
          (!aiKickstart ? (
            <div className="flex flex-col gap-3">
              <div className="reading-flow text-sm font-bold leading-relaxed text-slate-600">
                미루고 있는 일을 적으면 첫 행동과 바로 보낼 수 있는 초안을 정리해드립니다.
              </div>
              <textarea
                value={dreadedTask}
                onChange={(event) => setDreadedTask(event.target.value)}
                placeholder="예: 일정 잡기 메일 보내기"
                className="min-h-[92px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
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
            <ResultBox title="실행 부스터" tone="cyan" value={aiKickstart} onReset={() => setAiKickstart(null)} />
          ))}

        {activeTab === "mood" &&
          (!boosterMsg ? (
            <div className="flex flex-col gap-3">
              <div className="reading-flow text-sm font-bold leading-relaxed text-slate-600">측정 전 현재 컨디션을 짧게 적어주세요.</div>
              <input
                value={userMood}
                onChange={(event) => setUserMood(event.target.value)}
                placeholder="예: 수면 부족, 커피를 많이 마심"
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
          ))}

        {activeTab === "tip" &&
          (!dailyMission ? (
            <button
              disabled={loading.tip}
              onClick={() =>
                runAction("tip", async () => {
                  const response = await engine.getTip();
                  setDailyMission(response);
                })
              }
              className="flex min-h-[120px] w-full items-center justify-center rounded-xl border border-cyan-200 bg-cyan-100 py-4 text-sm font-extrabold text-cyan-700 shadow-sm transition-colors hover:bg-cyan-200 disabled:opacity-50"
            >
              <Sparkles className="mr-1.5 h-5 w-5" />
              {loading.tip ? "불러오는 중..." : "지금 바로 실천할 5분 팁"}
            </button>
          ) : (
            <ResultBox title="5분 팁" tone="cyan" value={dailyMission} onReset={() => setDailyMission(null)} />
          ))}

        {activeTab === "distraction" &&
          (!aiSolution ? (
            <div className="flex flex-col gap-3">
              <div className="reading-flow text-sm font-bold leading-relaxed text-slate-600">지금 집중을 끊는 원인을 적어보세요.</div>
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
          ))}
      </div>
    </div>
  );
}
