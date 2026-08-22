import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Brain, Crosshair, Gauge, Orbit, Zap } from "lucide-react";
import { SoundManager } from "../lib/soundManager";
import { finalizeBatteryResults, MEASURE_STAGES } from "../lib/measureBattery";
import { trackEvent } from "../lib/analytics";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

const REACTION_TARGETS = [
  { id: "top-left", label: "좌상" },
  { id: "top-right", label: "우상" },
  { id: "bottom-left", label: "좌하" },
  { id: "bottom-right", label: "우하" },
];

const REACTION_COLORS = [
  { id: "cyan", label: "파랑", className: "bg-cyan-300 border-cyan-100" },
  { id: "rose", label: "빨강", className: "bg-rose-400 border-rose-100" },
  { id: "amber", label: "노랑", className: "bg-amber-300 border-amber-100" },
  { id: "emerald", label: "초록", className: "bg-emerald-300 border-emerald-100" },
];

const REACTION_DIRECTIONS = [
  { id: "left", label: "왼쪽", glyph: "←" },
  { id: "right", label: "오른쪽", glyph: "→" },
  { id: "up", label: "위", glyph: "↑" },
  { id: "down", label: "아래", glyph: "↓" },
];

const STAGE_VARIANTS = {
  reaction: [
    {
      variantId: "signal",
      title: "신호 반응",
      prompt: "불이 들어온 원을 빠르게 눌러주세요.",
      instruction: "4개의 원 중 빛나는 위치만 누르세요.",
    },
    {
      variantId: "color",
      title: "색상 반응",
      prompt: "지정된 색이 뜨면 빠르게 눌러주세요.",
      instruction: "목표 색과 같은 버튼만 누르세요.",
    },
    {
      variantId: "direction",
      title: "방향 반응",
      prompt: "화살표 방향과 같은 버튼을 눌러주세요.",
      instruction: "방향을 보고 맞는 위치를 선택하세요.",
    },
  ],
  focus: [
    {
      variantId: "shape",
      title: "다른 도형 찾기",
      prompt: "비슷한 도형 속에서 다른 하나를 찾으세요.",
    },
    {
      variantId: "number",
      title: "숫자 찾기",
      prompt: "목표 숫자와 같은 칸을 빠르게 고르세요.",
    },
    {
      variantId: "symbol",
      title: "기호 구분",
      prompt: "비슷한 기호 중 다른 하나를 찾으세요.",
    },
    {
      variantId: "word",
      title: "방해 문자 무시",
      prompt: "방해 단어 사이에서 목표 단어만 고르세요.",
    },
  ],
  flow: [
    {
      variantId: "platform",
      title: "지속 점프",
      prompt: "좌우로 이동하며 리듬을 유지하세요.",
    },
    {
      variantId: "rhythm",
      title: "리듬 유지",
      prompt: "박자에 맞춰 초록 신호 때 눌러주세요.",
    },
    {
      variantId: "sequence",
      title: "순서 기억",
      prompt: "짧게 보인 순서를 기억해 그대로 누르세요.",
    },
  ],
};

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createMeasureSession() {
  return MEASURE_STAGES.map((baseStage) => ({
    ...baseStage,
    ...pickRandom(STAGE_VARIANTS[baseStage.id]),
    baseTitle: baseStage.title,
  }));
}

function getRemainingTotalTime(stages, stageIndex, stageTimeLeft) {
  const current = Math.max(0, stageTimeLeft);
  const upcoming = stages.slice(stageIndex + 1).reduce((sum, stage) => sum + stage.duration, 0);
  return current + upcoming;
}

export function MeasureScreen({ onDone }) {
  const [sessionStages, setSessionStages] = useState(() => createMeasureSession());
  const [phase, setPhase] = useState("intro");
  const [stageIndex, setStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState([]);
  const [stageSnapshot, setStageSnapshot] = useState({ score: 0, timeLeft: 0 });
  const [lastStageResult, setLastStageResult] = useState(null);

  const currentStage = sessionStages[stageIndex] || sessionStages[0];
  const totalScore =
    completedStages.reduce((sum, stage) => sum + stage.score, 0) + (phase === "running" ? stageSnapshot.score : 0);
  const totalTimeLeft =
    phase === "running"
      ? getRemainingTotalTime(sessionStages, stageIndex, stageSnapshot.timeLeft)
      : sessionStages.slice(stageIndex).reduce((sum, stage) => sum + stage.duration, 0);

  const startBattery = () => {
    const nextSession = createMeasureSession();
    SoundManager.playClick();
    setSessionStages(nextSession);
    setCompletedStages([]);
    setLastStageResult(null);
    setStageIndex(0);
    setStageSnapshot({ score: 0, timeLeft: nextSession[0].duration });
    setPhase("running");
    trackEvent("measure_start", { stageCount: nextSession.length });
  };

  const handleStageProgress = (snapshot) => {
    setStageSnapshot(snapshot);
  };

  const handleStageComplete = (stageResult) => {
    const nextCompleted = [...completedStages, stageResult];
    setCompletedStages(nextCompleted);
    setLastStageResult(stageResult);
    SoundManager.playSuccess();
    trackEvent("measure_stage_complete", { stage: stageResult.id, score: stageResult.score });

    if (stageIndex >= sessionStages.length - 1) {
      onDone(finalizeBatteryResults(nextCompleted));
      return;
    }

    setPhase("between");
  };

  const handleNextStage = () => {
    SoundManager.playClick();
    const nextIndex = stageIndex + 1;
    setStageIndex(nextIndex);
    setStageSnapshot({ score: 0, timeLeft: sessionStages[nextIndex].duration });
    setPhase("running");
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#082f49_100%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="px-5 pb-3 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold tracking-[0.22em] text-cyan-300/80">FOCUS BATTERY</div>
              <div className="mt-1 text-[1.65rem] font-black leading-tight">
                {phase === "intro" ? "60초 집중력 배터리" : `${currentStage.title} ${stageIndex + 1}/3`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400">총점</div>
              <div className="text-2xl font-black text-cyan-300">{Math.round(totalScore).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex gap-2">
              {sessionStages.map((stage, index) => {
                const active = index === stageIndex && phase === "running";
                const complete = index < stageIndex || (index === stageIndex && phase === "between");
                return (
                  <div
                    key={`${stage.id}-${stage.variantId}`}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      complete ? "bg-cyan-400" : active ? "bg-cyan-300/75" : "bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-300">
              <span>남은 시간 {Math.ceil(totalTimeLeft)}초</span>
              <span>{phase === "running" ? `${Math.ceil(stageSnapshot.timeLeft)}초` : `${currentStage.duration}초`}</span>
            </div>
          </div>
        </header>

        <div className="flex-1">
          {phase === "intro" ? <MeasureIntro onStart={startBattery} /> : null}
          {phase === "between" && lastStageResult ? (
            <BetweenStageCard
              stageResult={lastStageResult}
              onNext={handleNextStage}
              isLast={stageIndex >= sessionStages.length - 1}
            />
          ) : null}
          {phase === "running" ? (
            <StageRenderer
              key={`${currentStage.id}-${currentStage.variantId}`}
              stage={currentStage}
              onProgress={handleStageProgress}
              onComplete={handleStageComplete}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MeasureIntro({ onStart }) {
  return (
    <div className="scrollbar-none flex h-full flex-col items-center overflow-y-auto px-5 pb-6 pt-2 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_32px_rgba(34,211,238,0.18)]">
        <Brain className="h-10 w-10 text-cyan-300" />
      </div>
      <h2 className="mb-2 text-center text-[2rem] font-black leading-tight">
        반응, 주의, 몰입을
        <br />한 번에 측정합니다
      </h2>
      <p className="reading-flow mb-5 max-w-sm text-[13px] font-medium leading-relaxed text-slate-300">
        10가지 테스트 후보 중 3가지를 무작위로 골라 60초 동안 오늘의 집중 흐름을 확인합니다.
      </p>

      <div className="mb-5 grid w-full max-w-sm gap-2.5 text-left">
        <IntroBullet icon={Zap} title="반응 계열" body="신호, 색상, 방향 중 하나로 빠른 반응 속도를 확인합니다." />
        <IntroBullet icon={Crosshair} title="주의 계열" body="숫자, 도형, 문자 방해 속에서 목표를 고릅니다." />
        <IntroBullet icon={Orbit} title="몰입 계열" body="점프, 리듬, 순서 기억 중 하나로 집중 지속력을 봅니다." />
      </div>

      <button
        onClick={onStart}
        className="mt-auto flex items-center rounded-2xl bg-cyan-400 px-8 py-3.5 text-lg font-black text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-transform active:scale-[0.98]"
      >
        측정 시작
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
    </div>
  );
}

function IntroBullet({ icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
      <div className="mb-2 flex items-center text-sm font-black text-white">
        <Icon className="mr-2 h-4 w-4 text-cyan-300" />
        {title}
      </div>
      <div className="reading-flow text-[13px] leading-relaxed text-slate-300">{body}</div>
    </div>
  );
}

function BetweenStageCard({ stageResult, onNext, isLast }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 text-xs font-extrabold tracking-[0.22em] text-cyan-300/80">STAGE CLEAR</div>
      <h3 className="mb-2 text-3xl font-black">{stageResult.title} 완료</h3>
      <div className="mb-6 text-5xl font-black text-cyan-300">{stageResult.score.toLocaleString()}</div>
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-slate-200">
        {stageResult.feedback}
      </div>
      <button
        onClick={onNext}
        className="rounded-2xl border border-cyan-300/30 bg-cyan-400 px-8 py-4 text-lg font-black text-slate-950"
      >
        {isLast ? "결과 보기" : "다음 단계"}
      </button>
    </div>
  );
}

function StageRenderer({ stage, onProgress, onComplete }) {
  if (stage.id === "reaction") {
    return <ReactionStage stage={stage} onProgress={onProgress} onComplete={onComplete} />;
  }
  if (stage.id === "focus") {
    return <FocusStage stage={stage} onProgress={onProgress} onComplete={onComplete} />;
  }
  if (stage.variantId === "rhythm") {
    return <RhythmStage stage={stage} onProgress={onProgress} onComplete={onComplete} />;
  }
  if (stage.variantId === "sequence") {
    return <SequenceStage stage={stage} onProgress={onProgress} onComplete={onComplete} />;
  }
  return <FlowStage stage={stage} onProgress={onProgress} onComplete={onComplete} />;
}

function useStageTimer(duration, onProgress, score) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isExpired, setIsExpired] = useState(false);
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = performance.now();
    setTimeLeft(duration);
    setIsExpired(false);

    const timer = window.setInterval(() => {
      const elapsedSeconds = (performance.now() - startedAtRef.current) / 1000;
      const next = Math.max(0, Number((duration - elapsedSeconds).toFixed(1)));
      setTimeLeft(next);
      if (next <= 0) setIsExpired(true);
    }, 100);

    return () => window.clearInterval(timer);
  }, [duration]);

  useEffect(() => {
    onProgress({ score, timeLeft });
  }, [onProgress, score, timeLeft]);

  return { timeLeft, isExpired };
}

function ReactionStage({ stage, onProgress, onComplete }) {
  const duration = stage.duration;
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("waiting");
  const [target, setTarget] = useState(() => createReactionTarget(stage.variantId));
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const [lastReactionMs, setLastReactionMs] = useState(null);
  const reactionValuesRef = useRef([]);
  const activeSinceRef = useRef(0);
  const spawnTimeoutRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const doneRef = useRef(false);
  const { timeLeft, isExpired } = useStageTimer(duration, onProgress, score);

  const clearReactionTimers = useCallback(() => {
    if (spawnTimeoutRef.current) window.clearTimeout(spawnTimeoutRef.current);
    if (missTimeoutRef.current) window.clearTimeout(missTimeoutRef.current);
    spawnTimeoutRef.current = null;
    missTimeoutRef.current = null;
  }, []);

  const scheduleTarget = useCallback((delay = 350 + Math.random() * 850) => {
    clearReactionTimers();
    setPhase("waiting");
    spawnTimeoutRef.current = window.setTimeout(() => {
      setTarget(createReactionTarget(stage.variantId));
      setPhase("active");
      activeSinceRef.current = performance.now();
      missTimeoutRef.current = window.setTimeout(() => {
        setMisses((prev) => prev + 1);
        setPhase("missed");
        SoundManager.playFall();
        window.setTimeout(() => {
          if (!doneRef.current) scheduleTarget(260);
        }, 220);
      }, 1200);
    }, delay);
  }, [clearReactionTimers, stage.variantId]);

  useEffect(() => {
    doneRef.current = false;
    reactionValuesRef.current = [];

    scheduleTarget();
    return () => {
      doneRef.current = true;
      clearReactionTimers();
    };
  }, [clearReactionTimers, scheduleTarget]);

  useEffect(() => {
    if (!isExpired || doneRef.current) return;
    doneRef.current = true;

    const avgReactionMs = reactionValuesRef.current.length
      ? Math.round(reactionValuesRef.current.reduce((sum, item) => sum + item, 0) / reactionValuesRef.current.length)
      : null;

    onComplete({
      id: "reaction",
      title: stage.title,
      score,
      duration,
      metrics: {
        hits,
        misses,
        falseStarts,
        avgReactionMs,
        variantId: stage.variantId,
      },
      feedback:
        avgReactionMs && avgReactionMs < 380
          ? "반응 속도가 안정적으로 빠릅니다."
          : "신호를 본 뒤 누르는 리듬을 조금 더 일정하게 맞추면 좋아집니다.",
    });
  }, [duration, falseStarts, hits, isExpired, misses, onComplete, score, stage.title, stage.variantId]);

  const handleTap = (selectedId) => {
    if (phase !== "active") {
      setFalseStarts((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 25));
      SoundManager.playClick();
      return;
    }

    if (selectedId !== target.answerId) {
      setMisses((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 20));
      setLastReactionMs(null);
      setPhase("wrong");
      SoundManager.playClick();
      window.setTimeout(() => {
        if (!doneRef.current) scheduleTarget(220);
      }, 180);
      return;
    }

    const reactionMs = Math.round(performance.now() - activeSinceRef.current);
    reactionValuesRef.current.push(reactionMs);
    setLastReactionMs(reactionMs);
    setHits((prev) => prev + 1);
    setPhase("hit");
    setScore((prev) => prev + Math.max(45, 190 - Math.round(reactionMs / 7)));
    SoundManager.playScore();
    window.setTimeout(() => {
      if (!doneRef.current) scheduleTarget(220);
    }, 220);
  };

  return (
    <StageSurface icon={Zap} title={stage.title} description={stage.prompt} score={score} timeLeft={timeLeft} accent="cyan">
      <div className="mx-auto mt-5 w-full max-w-sm">
        <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/65 px-4 py-3 text-center">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-300/80">
            {phase === "active" ? "지금 누르세요" : "대기 중"}
          </div>
          <div className="mt-1 text-lg font-black text-white">{getReactionPrompt(stage.variantId, target)}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {getReactionButtons(stage.variantId).map((button) => {
            const isActive = phase === "active" && button.id === target.answerId;
            return (
              <button
                key={button.id}
                type="button"
                onClick={() => handleTap(button.id)}
                className={`flex h-24 items-center justify-center rounded-3xl border text-3xl font-black transition-all active:scale-95 ${
                  isActive
                    ? getReactionActiveClass(stage.variantId, target)
                    : "border-white/10 bg-white/10 text-slate-200"
                }`}
              >
                {button.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/72 px-4 py-3 text-center backdrop-blur">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-300/80">
            {lastReactionMs ? `최근 반응 ${lastReactionMs}ms` : stage.instruction}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-200">
            성공 {hits} / 놓침 {misses}
          </div>
        </div>
      </div>
    </StageSurface>
  );
}

function createReactionTarget(variantId) {
  if (variantId === "color") {
    const color = pickRandom(REACTION_COLORS);
    return { answerId: color.id, label: color.label, color };
  }
  if (variantId === "direction") {
    const direction = pickRandom(REACTION_DIRECTIONS);
    return { answerId: direction.id, label: direction.label, glyph: direction.glyph };
  }
  const target = pickRandom(REACTION_TARGETS);
  return { answerId: target.id, label: target.label };
}

function getReactionButtons(variantId) {
  if (variantId === "color") return REACTION_COLORS.map((item) => ({ id: item.id, label: item.label }));
  if (variantId === "direction") return REACTION_DIRECTIONS.map((item) => ({ id: item.id, label: item.glyph }));
  return REACTION_TARGETS.map((item) => ({ id: item.id, label: "" }));
}

function getReactionPrompt(variantId, target) {
  if (variantId === "color") return `${target.label} 버튼`;
  if (variantId === "direction") return `${target.glyph} 방향`;
  return `${target.label} 원`;
}

function getReactionActiveClass(variantId, target) {
  if (variantId === "color") return `${target.color.className} scale-100 text-slate-950 shadow-[0_0_40px_rgba(103,232,249,0.55)]`;
  return "scale-100 border-cyan-200 bg-cyan-300 text-slate-950 shadow-[0_0_40px_rgba(103,232,249,0.6)]";
}

function FocusStage({ stage, onProgress, onComplete }) {
  const duration = stage.duration;
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [round, setRound] = useState(() => createFocusRound(stage.variantId));
  const [lastLatency, setLastLatency] = useState(null);
  const roundStartedAtRef = useRef(performance.now());
  const roundTimeoutRef = useRef(null);
  const latencyValuesRef = useRef([]);
  const doneRef = useRef(false);
  const { timeLeft, isExpired } = useStageTimer(duration, onProgress, score);

  useEffect(() => {
    doneRef.current = false;
    latencyValuesRef.current = [];
    return () => {
      doneRef.current = true;
      if (roundTimeoutRef.current) window.clearTimeout(roundTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    roundStartedAtRef.current = performance.now();
    if (roundTimeoutRef.current) window.clearTimeout(roundTimeoutRef.current);

    roundTimeoutRef.current = window.setTimeout(() => {
      setWrong((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 25));
      setRound(createFocusRound(stage.variantId));
    }, 2600);
  }, [round, stage.variantId]);

  useEffect(() => {
    if (!isExpired || doneRef.current) return;
    doneRef.current = true;

    const avgPickMs = latencyValuesRef.current.length
      ? Math.round(latencyValuesRef.current.reduce((sum, item) => sum + item, 0) / latencyValuesRef.current.length)
      : null;

    onComplete({
      id: "focus",
      title: stage.title,
      score,
      duration,
      metrics: {
        correct,
        wrong,
        avgPickMs,
        variantId: stage.variantId,
      },
      feedback:
        correct >= wrong * 2
          ? "방해 요소 속에서도 목표를 잘 골라냈습니다."
          : "시선이 흔들릴 때 오답이 늘었습니다. 목표 하나에 시선을 고정해보세요.",
    });
  }, [correct, duration, isExpired, onComplete, score, stage.title, stage.variantId, wrong]);

  const handlePick = (index) => {
    const latency = Math.round(performance.now() - roundStartedAtRef.current);
    setLastLatency(latency);

    if (index === round.targetIndex) {
      latencyValuesRef.current.push(latency);
      setCorrect((prev) => prev + 1);
      setScore((prev) => prev + Math.max(60, 185 - Math.round(latency / 11)));
      SoundManager.playScore();
    } else {
      setWrong((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 35));
      SoundManager.playClick();
    }

    setRound(createFocusRound(stage.variantId));
  };

  return (
    <StageSurface icon={Crosshair} title={stage.title} description={stage.prompt} score={score} timeLeft={timeLeft} accent="orange">
      <div className="mx-auto mt-4 w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400">현재 목표</div>
            <div className="text-lg font-black text-orange-300">{round.targetLabel}</div>
          </div>
          <div className="text-right text-xs font-extrabold text-slate-300">
            <div>정답 {correct}</div>
            <div>오답 {wrong}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {round.cells.map((cell, index) => (
            <button
              key={`${round.seed}-${index}`}
              onClick={() => handlePick(index)}
              className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-1 text-2xl font-black transition-transform active:scale-95"
            >
              <span className={index === round.targetIndex ? "text-orange-300" : "text-slate-200"}>{cell}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 text-center text-xs font-extrabold tracking-[0.2em] text-orange-200/90">
          {lastLatency ? `LAST ${lastLatency}MS` : "TARGET ONLY"}
        </div>
      </div>
    </StageSurface>
  );
}

function createFocusRound(variantId) {
  if (variantId === "number") {
    const targetNumber = String(Math.floor(Math.random() * 9) + 1);
    const distractor = String(((Number(targetNumber) + Math.floor(Math.random() * 7) + 1) % 9) + 1);
    return createGridRound(targetNumber, distractor, `숫자 ${targetNumber}`);
  }

  if (variantId === "word") {
    const target = pickRandom(["집중", "몰입", "정리", "시작"]);
    const distractor = pickRandom(["알림", "잡음", "멈춤", "방해"].filter((word) => word !== target));
    return createGridRound(target, distractor, target);
  }

  if (variantId === "symbol") {
    const target = pickRandom(["◇", "△", "◎", "□"]);
    const distractor = pickRandom(["◇", "△", "◎", "□"].filter((item) => item !== target));
    return createGridRound(target, distractor, target);
  }

  const target = pickRandom(["●", "■", "▲", "◆"]);
  const distractor = pickRandom(["●", "■", "▲", "◆"].filter((item) => item !== target));
  return createGridRound(target, distractor, target);
}

function createGridRound(target, distractor, targetLabel) {
  const targetIndex = Math.floor(Math.random() * 9);
  const cells = Array.from({ length: 9 }, (_, index) => (index === targetIndex ? target : distractor));
  return {
    seed: `${target}-${distractor}-${targetIndex}-${Date.now()}`,
    targetIndex,
    targetLabel,
    cells,
  };
}

function FlowStage({ stage, onProgress, onComplete }) {
  const duration = stage.duration;
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const startedAtRef = useRef(0);
  const doneRef = useRef(false);
  const touchZoneRef = useRef(null);
  const activePointerIdRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState(duration);
  const [falls, setFalls] = useState(0);
  const [score, setScore] = useState(0);
  const [alertMsg, setAlertMsg] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const gameState = useRef({
    player: { x: 150, y: 100, vx: 0, vy: 0, width: 24, height: 24, color: "#34d399" },
    platforms: [],
    score: 0,
    falls: 0,
    keys: { left: false, right: false },
    isPaused: false,
    isDone: false,
  });

  const createPlatform = (y) => {
    const types = [
      { color: "#22c55e", width: 84 },
      { color: "#10b981", width: 64 },
      { color: "#facc15", width: 46 },
    ];

    const type = pickRandom(types);
    const x = Math.random() * (CANVAS_WIDTH - type.width - 20) + 10;
    return { x, y, width: type.width, height: 12, color: type.color, passed: false };
  };

  useEffect(() => {
    doneRef.current = false;
    startedAtRef.current = performance.now();
    setIsExpired(false);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const state = gameState.current;

    state.platforms = [];
    state.score = 0;
    state.falls = 0;
    state.isPaused = false;
    state.isDone = false;
    state.player = { x: 150, y: 100, vx: 0, vy: 0, width: 24, height: 24, color: "#34d399" };

    for (let i = 0; i < 8; i += 1) {
      state.platforms.push(createPlatform(400 - i * 80));
    }

    finishTimeoutRef.current = window.setTimeout(() => {
      setIsExpired(true);
    }, duration * 1000);

    const resetAfterFall = () => {
      state.player.y = 100;
      state.player.vy = 0;
      state.player.x = CANVAS_WIDTH / 2 - state.player.width / 2;
      state.platforms = [createPlatform(300), createPlatform(220), createPlatform(140)];
      state.isPaused = false;
      setAlertMsg(null);
    };

    const update = () => {
      if (state.isPaused || state.isDone) return;

      const player = state.player;
      player.vy += 0.4;

      if (state.keys.left) player.vx = -4;
      else if (state.keys.right) player.vx = 4;
      else player.vx *= 0.82;

      player.y += player.vy;
      player.x += player.vx;

      if (player.x < -player.width) player.x = CANVAS_WIDTH;
      if (player.x > CANVAS_WIDTH) player.x = -player.width;

      if (player.y < 200) {
        const diff = 200 - player.y;
        player.y = 200;
        state.platforms.forEach((platform) => {
          platform.y += diff;
        });
        state.score += Math.floor(diff * 0.55);
      }

      if (player.vy > 0) {
        state.platforms.forEach((platform) => {
          const intersects =
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height + player.vy;

          if (intersects) {
            player.y = platform.y - player.height;
            player.vy = -9;
            SoundManager.playJump();

            if (!platform.passed) {
              platform.passed = true;
              state.score += 50;
              SoundManager.playScore();
            }
          }
        });
      }

      if (player.y > CANVAS_HEIGHT + 100) {
        state.falls += 1;
        state.isPaused = true;
        setFalls(state.falls);
        setAlertMsg("집중 리듬이 끊겼어요");
        SoundManager.playFall();
        timeoutRef.current = window.setTimeout(resetAfterFall, 900);
      }

      state.platforms = state.platforms.filter((platform) => platform.y < CANVAS_HEIGHT + 50);
      while (state.platforms.length < 8) {
        const topY = Math.min(...state.platforms.map((platform) => platform.y));
        state.platforms.push(createPlatform(topY - (60 + Math.random() * 40)));
      }

      setScore(state.score);
    };

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let y = 0; y < CANVAS_HEIGHT; y += 24) {
        ctx.fillRect(0, y, CANVAS_WIDTH, 1);
      }

      state.platforms.forEach((platform) => {
        ctx.fillStyle = platform.color;
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 6);
        ctx.fill();
      });

      const { player } = state;
      ctx.fillStyle = player.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(52,211,153,0.45)";
      ctx.beginPath();
      ctx.roundRect(player.x, player.y, player.width, player.height, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      update();
      draw();
      animationRef.current = window.requestAnimationFrame(loop);
    };

    animationRef.current = window.requestAnimationFrame(loop);

    return () => {
      doneRef.current = true;
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
    };
  }, [duration]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (gameState.current.isPaused || gameState.current.isDone) return;
      const elapsedSeconds = (performance.now() - startedAtRef.current) / 1000;
      const next = Math.max(0, Number((duration - elapsedSeconds).toFixed(1)));
      setTimeLeft(next);
    }, 100);

    return () => window.clearInterval(timer);
  }, [duration]);

  useEffect(() => {
    onProgress({ score, timeLeft });
  }, [onProgress, score, timeLeft]);

  useEffect(() => {
    if (!isExpired || doneRef.current) return;
    doneRef.current = true;
    gameState.current.isDone = true;

    onComplete({
      id: "flow",
      title: stage.title,
      score,
      duration,
      metrics: {
        falls,
        peakScore: score,
        variantId: stage.variantId,
      },
      feedback:
        falls <= 1 ? "몰입 리듬을 마지막까지 잘 유지했습니다." : "리듬이 자주 끊겼습니다. 짧은 휴식 후 다시 측정해보세요.",
    });
  }, [duration, falls, isExpired, onComplete, score, stage.title, stage.variantId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") gameState.current.keys.left = true;
      if (event.key === "ArrowRight") gameState.current.keys.right = true;
    };
    const handleKeyUp = (event) => {
      if (event.key === "ArrowLeft") gameState.current.keys.left = false;
      if (event.key === "ArrowRight") gameState.current.keys.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      gameState.current.keys.left = false;
      gameState.current.keys.right = false;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const setActiveDirection = (direction) => {
    gameState.current.keys.left = direction === "left";
    gameState.current.keys.right = direction === "right";
  };

  const resolveDirection = (event) => {
    const zone = touchZoneRef.current;
    if (!zone) return null;

    const rect = zone.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    return event.clientX < midX ? "left" : "right";
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setActiveDirection(resolveDirection(event));
  };

  const handlePointerMove = (event) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    setActiveDirection(resolveDirection(event));
  };

  const handlePointerEnd = (event) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    activePointerIdRef.current = null;
    setActiveDirection(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <StageSurface
      icon={Gauge}
      title={stage.title}
      description={stage.prompt}
      score={score}
      timeLeft={timeLeft}
      accent="emerald"
      noPad
    >
      <div className="relative h-full">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="h-full w-full object-cover" />

        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs font-bold text-slate-300 backdrop-blur">
          낙하 {falls}회
        </div>

        {alertMsg ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
            <div className="rounded-2xl border border-emerald-200/30 bg-slate-900 px-7 py-4 text-lg font-black text-emerald-300 shadow-xl">
              {alertMsg}
            </div>
          </div>
        ) : null}

        <div
          ref={touchZoneRef}
          className="absolute inset-0"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
        />

        <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex justify-between text-xs font-extrabold text-slate-300">
          <span>왼쪽 터치</span>
          <span>오른쪽 터치</span>
        </div>
      </div>
    </StageSurface>
  );
}

function RhythmStage({ stage, onProgress, onComplete }) {
  const duration = stage.duration;
  const [score, setScore] = useState(0);
  const [falls, setFalls] = useState(0);
  const [beat, setBeat] = useState(0);
  const [goodWindow, setGoodWindow] = useState(false);
  const doneRef = useRef(false);
  const { timeLeft, isExpired } = useStageTimer(duration, onProgress, score);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBeat((prev) => prev + 1);
      setGoodWindow(true);
      window.setTimeout(() => setGoodWindow(false), 420);
    }, 1100);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isExpired || doneRef.current) return;
    doneRef.current = true;
    onComplete({
      id: "flow",
      title: stage.title,
      score,
      duration,
      metrics: { falls, peakScore: score, variantId: stage.variantId },
      feedback: falls <= 2 ? "박자 리듬을 안정적으로 유지했습니다." : "박자를 놓친 구간이 있었습니다. 천천히 다시 맞춰보세요.",
    });
  }, [duration, falls, isExpired, onComplete, score, stage.title, stage.variantId]);

  const handleTap = () => {
    if (goodWindow) {
      setScore((prev) => prev + 115);
      SoundManager.playScore();
    } else {
      setFalls((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 45));
      SoundManager.playClick();
    }
  };

  return (
    <StageSurface icon={Orbit} title={stage.title} description={stage.prompt} score={score} timeLeft={timeLeft} accent="emerald">
      <div className="mx-auto mt-8 flex w-full max-w-sm flex-col items-center">
        <button
          type="button"
          onClick={handleTap}
          className={`flex h-44 w-44 items-center justify-center rounded-full border text-2xl font-black transition-all active:scale-95 ${
            goodWindow
              ? "scale-105 border-emerald-100 bg-emerald-300 text-slate-950 shadow-[0_0_46px_rgba(110,231,183,0.5)]"
              : "border-white/10 bg-white/10 text-slate-200"
          }`}
        >
          {goodWindow ? "지금" : "대기"}
        </button>
        <div className="mt-6 grid w-full grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs font-bold text-slate-400">박자</div>
            <div className="text-xl font-black text-emerald-300">{beat}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs font-bold text-slate-400">실수</div>
            <div className="text-xl font-black text-rose-300">{falls}</div>
          </div>
        </div>
      </div>
    </StageSurface>
  );
}

function SequenceStage({ stage, onProgress, onComplete }) {
  const flashGapMs = 620;
  const flashOnMs = 360;
  const inputDelayMs = 520;
  const nextRoundDelayMs = 1150;
  const duration = stage.duration;
  const [score, setScore] = useState(0);
  const [falls, setFalls] = useState(0);
  const [sequence, setSequence] = useState(() => createSequence());
  const [showing, setShowing] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [flashIndex, setFlashIndex] = useState(null);
  const [roundState, setRoundState] = useState("showing");
  const doneRef = useRef(false);
  const nextSequenceTimerRef = useRef(null);
  const { timeLeft, isExpired } = useStageTimer(duration, onProgress, score);

  useEffect(() => {
    let cancelled = false;
    const flashTimers = [];
    setShowing(true);
    setRoundState("showing");
    setCursor(0);
    if (nextSequenceTimerRef.current) {
      window.clearTimeout(nextSequenceTimerRef.current);
      nextSequenceTimerRef.current = null;
    }

    sequence.forEach((item, index) => {
      flashTimers.push(window.setTimeout(() => {
        if (!cancelled) setFlashIndex(item);
      }, index * flashGapMs));
      flashTimers.push(window.setTimeout(() => {
        if (!cancelled) setFlashIndex(null);
      }, index * flashGapMs + flashOnMs));
    });

    const doneTimer = window.setTimeout(() => {
      if (!cancelled) {
        setShowing(false);
        setRoundState("input");
      }
    }, sequence.length * flashGapMs + inputDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(doneTimer);
      flashTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [sequence]);

  useEffect(() => {
    return () => {
      if (nextSequenceTimerRef.current) {
        window.clearTimeout(nextSequenceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isExpired || doneRef.current) return;
    doneRef.current = true;
    onComplete({
      id: "flow",
      title: stage.title,
      score,
      duration,
      metrics: { falls, peakScore: score, variantId: stage.variantId },
      feedback: falls <= 2 ? "순서를 기억하는 집중 흐름이 좋았습니다." : "중간 순서가 흔들렸습니다. 짧게 끊어서 기억해보세요.",
    });
  }, [duration, falls, isExpired, onComplete, score, stage.title, stage.variantId]);

  const handlePick = (index) => {
    if (showing || roundState !== "input" || doneRef.current) return;

    if (sequence[cursor] === index) {
      setScore((prev) => prev + 145);
      SoundManager.playScore();
      if (cursor >= sequence.length - 1) {
        setCursor(sequence.length);
        setFlashIndex(index);
        setRoundState("success");
        nextSequenceTimerRef.current = window.setTimeout(() => {
          setFlashIndex(null);
          setSequence(createSequence());
          nextSequenceTimerRef.current = null;
        }, nextRoundDelayMs);
      } else {
        setCursor((prev) => prev + 1);
      }
      return;
    }

    setFalls((prev) => prev + 1);
    setScore((prev) => Math.max(0, prev - 55));
    SoundManager.playClick();
    setFlashIndex(index);
    setRoundState("miss");
    nextSequenceTimerRef.current = window.setTimeout(() => {
      setFlashIndex(null);
      setSequence(createSequence());
      nextSequenceTimerRef.current = null;
    }, nextRoundDelayMs);
  };

  const statusText =
    roundState === "success"
      ? "정답! 다음 순서 준비 중"
      : roundState === "miss"
        ? "다시 보여드릴게요"
        : showing
          ? "순서를 보여주는 중"
          : "같은 순서로 누르세요";
  const buttonsDisabled = showing || roundState !== "input";

  return (
    <StageSurface icon={Brain} title={stage.title} description={stage.prompt} score={score} timeLeft={timeLeft} accent="emerald">
      <div className="mx-auto mt-6 w-full max-w-sm">
        <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/65 px-4 py-3 text-center">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-emerald-300/80">
            {statusText}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-200">
            진행 {Math.min(cursor + 1, sequence.length)} / {sequence.length}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              type="button"
              onClick={() => handlePick(index)}
              disabled={buttonsDisabled}
              className={`h-28 rounded-3xl border text-2xl font-black transition-all active:scale-95 ${
                flashIndex === index
                  ? "scale-105 border-emerald-100 bg-emerald-300 text-slate-950 shadow-[0_0_42px_rgba(110,231,183,0.5)]"
                  : buttonsDisabled
                    ? "border-white/10 bg-white/5 text-slate-500"
                    : "border-white/10 bg-white/10 text-slate-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </StageSurface>
  );
}

function createSequence() {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 4));
}

function StageSurface({ icon: Icon, title, description, score, timeLeft, accent, children, noPad = false }) {
  const accentClass =
    accent === "orange"
      ? "text-orange-300 border-orange-300/30"
      : accent === "emerald"
        ? "text-emerald-300 border-emerald-300/30"
        : "text-cyan-300 border-cyan-300/30";

  return (
    <div className={`flex h-full flex-col ${noPad ? "" : "px-5 pb-5"}`}>
      <div className={noPad ? "px-5 pb-3" : ""}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black ${accentClass}`}>
              <Icon className="mr-1.5 h-4 w-4" />
              {title}
            </div>
            <p className="mt-3 max-w-[18rem] text-sm font-semibold leading-relaxed text-slate-200">{description}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400">현재 점수</div>
            <div className="text-3xl font-black text-white">{Math.round(score).toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-slate-300">
          <span>이 단계 남은 시간</span>
          <span>{Math.ceil(timeLeft)}초</span>
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
