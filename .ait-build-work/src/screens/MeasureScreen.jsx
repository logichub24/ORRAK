import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Brain, Crosshair, Gauge, Orbit, Zap } from "lucide-react";
import { SoundManager } from "../lib/soundManager";
import { finalizeBatteryResults, MEASURE_STAGES } from "../lib/measureBattery";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

function getRemainingTotalTime(stageIndex, stageTimeLeft) {
  const current = Math.max(0, stageTimeLeft);
  const upcoming = MEASURE_STAGES.slice(stageIndex + 1).reduce((sum, stage) => sum + stage.duration, 0);
  return current + upcoming;
}

export function MeasureScreen({ onDone }) {
  const [phase, setPhase] = useState("intro");
  const [stageIndex, setStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState([]);
  const [stageSnapshot, setStageSnapshot] = useState({ score: 0, timeLeft: 0 });
  const [lastStageResult, setLastStageResult] = useState(null);

  const currentStage = MEASURE_STAGES[stageIndex];
  const totalScore =
    completedStages.reduce((sum, stage) => sum + stage.score, 0) + (phase === "running" ? stageSnapshot.score : 0);
  const totalTimeLeft =
    phase === "running"
      ? getRemainingTotalTime(stageIndex, stageSnapshot.timeLeft)
      : MEASURE_STAGES.slice(stageIndex).reduce((sum, stage) => sum + stage.duration, 0);

  const startBattery = () => {
    SoundManager.playClick();
    setCompletedStages([]);
    setLastStageResult(null);
    setStageIndex(0);
    setStageSnapshot({ score: 0, timeLeft: MEASURE_STAGES[0].duration });
    setPhase("running");
  };

  const handleStageProgress = (snapshot) => {
    setStageSnapshot(snapshot);
  };

  const handleStageComplete = (stageResult) => {
    const nextCompleted = [...completedStages, stageResult];
    setCompletedStages(nextCompleted);
    setLastStageResult(stageResult);
    SoundManager.playSuccess();

    if (stageIndex >= MEASURE_STAGES.length - 1) {
      onDone(finalizeBatteryResults(nextCompleted));
      return;
    }

    setPhase("between");
  };

  const handleNextStage = () => {
    SoundManager.playClick();
    const nextIndex = stageIndex + 1;
    setStageIndex(nextIndex);
    setStageSnapshot({ score: 0, timeLeft: MEASURE_STAGES[nextIndex].duration });
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
                {phase === "intro" ? "60초 집중력 배터리" : `${getStageLabel(currentStage.id)} ${stageIndex + 1}/3`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400">총점</div>
              <div className="text-2xl font-black text-cyan-300">{Math.round(totalScore).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex gap-2">
              {MEASURE_STAGES.map((stage, index) => {
                const active = index === stageIndex && phase === "running";
                const complete = index < stageIndex || (index === stageIndex && phase === "between");
                return (
                  <div
                    key={stage.id}
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
            <BetweenStageCard stageResult={lastStageResult} onNext={handleNextStage} isLast={stageIndex >= 2} />
          ) : null}
          {phase === "running" ? (
            <StageRenderer
              key={currentStage.id}
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
    <div className="flex h-full flex-col items-center overflow-y-auto px-5 pb-6 pt-2 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_32px_rgba(34,211,238,0.18)]">
        <Brain className="h-10 w-10 text-cyan-300" />
      </div>
      <h2 className="mb-2 text-center text-[2rem] font-black leading-tight">
        반응, 주의, 몰입을 한 번에
        <br />
        측정합니다
      </h2>
      <p className="mb-5 max-w-sm text-[13px] font-medium leading-relaxed text-slate-300">
        1단계 반응 속도, 2단계 선택적 주의, 3단계 지속 집중 순서로 총 60초 동안 진행됩니다.
      </p>

      <div className="mb-5 grid w-full max-w-sm gap-2.5 text-left">
        <IntroBullet icon={Zap} title="반응 속도" body="신호가 뜨는 순간 빠르게 눌러 반응 지연을 확인합니다." />
        <IntroBullet icon={Crosshair} title="선택적 주의" body="비슷한 카드 사이에서 다른 하나를 빠르게 골라냅니다." />
        <IntroBullet icon={Orbit} title="지속 집중" body="짧은 플로우 게임으로 마지막까지 리듬을 유지합니다." />
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
      <div className="text-[13px] leading-relaxed text-slate-300">{body}</div>
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
    return <ReactionStage duration={stage.duration} onProgress={onProgress} onComplete={onComplete} />;
  }
  if (stage.id === "focus") {
    return <FocusStage duration={stage.duration} onProgress={onProgress} onComplete={onComplete} />;
  }
  return <FlowStage duration={stage.duration} onProgress={onProgress} onComplete={onComplete} />;
}

function ReactionStage({ duration, onProgress, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("waiting");
  const [targetSide, setTargetSide] = useState("left");
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const [lastReactionMs, setLastReactionMs] = useState(null);
  const reactionValuesRef = useRef([]);
  const spawnTimeoutRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const activeSinceRef = useRef(0);
  const doneRef = useRef(false);
  const scheduleTargetRef = useRef(() => {});

  useEffect(() => {
    function clearTimers() {
      if (spawnTimeoutRef.current) window.clearTimeout(spawnTimeoutRef.current);
      if (missTimeoutRef.current) window.clearTimeout(missTimeoutRef.current);
    }

    function scheduleTarget() {
      clearTimers();
      setPhase("waiting");

      spawnTimeoutRef.current = window.setTimeout(() => {
        setTargetSide(Math.random() > 0.5 ? "left" : "right");
        setPhase("active");
        activeSinceRef.current = performance.now();

        missTimeoutRef.current = window.setTimeout(() => {
          setMisses((prev) => prev + 1);
          setPhase("missed");
          SoundManager.playFall();
          window.setTimeout(() => {
            if (!doneRef.current) {
              scheduleTarget();
            }
          }, 250);
        }, 1100);
      }, 400 + Math.random() * 900);
    }

    scheduleTargetRef.current = scheduleTarget;
    scheduleTarget();

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, Number((prev - 0.1).toFixed(1))));
    }, 100);

    return () => {
      doneRef.current = true;
      window.clearInterval(timer);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    onProgress({ score, timeLeft });
  }, [score, timeLeft, onProgress]);

  useEffect(() => {
    if (timeLeft > 0 || doneRef.current) return;
    doneRef.current = true;

    const avgReactionMs = reactionValuesRef.current.length
      ? Math.round(reactionValuesRef.current.reduce((sum, item) => sum + item, 0) / reactionValuesRef.current.length)
      : null;

    onComplete({
      id: "reaction",
      title: "반응 속도",
      score,
      duration,
      metrics: {
        hits,
        misses,
        falseStarts,
        avgReactionMs,
      },
      feedback:
        avgReactionMs && avgReactionMs < 380
          ? "반응 속도가 상당히 안정적입니다."
          : "반응 지연이 조금 보여요. 측정 전 각성 루틴을 짧게 넣으면 더 좋아질 수 있어요.",
    });
  }, [duration, falseStarts, hits, misses, onComplete, score, timeLeft]);

  const handleTap = () => {
    if (phase === "active") {
      const reactionMs = Math.round(performance.now() - activeSinceRef.current);
      reactionValuesRef.current.push(reactionMs);
      setLastReactionMs(reactionMs);
      setHits((prev) => prev + 1);
      setPhase("hit");
      setScore((prev) => prev + Math.max(45, 190 - Math.round(reactionMs / 7)));
      SoundManager.playScore();
      if (missTimeoutRef.current) window.clearTimeout(missTimeoutRef.current);

      window.setTimeout(() => {
        if (!doneRef.current) {
          scheduleTargetRef.current();
        }
      }, 180);
      return;
    }

    setFalseStarts((prev) => prev + 1);
    setScore((prev) => Math.max(0, prev - 30));
    setLastReactionMs(null);
    SoundManager.playClick();
  };

  return (
    <StageSurface
      icon={Zap}
      title="신호가 뜨면 바로 탭"
      description="가운데는 비워두었습니다. 좌우 신호 원만 보고 빠르게 눌러주세요."
      score={score}
      timeLeft={timeLeft}
      accent="cyan"
    >
      <button onClick={handleTap} className="relative mx-auto mt-6 flex h-[54vh] w-full max-w-sm items-center justify-center">
        <div className="absolute inset-y-0 left-[14%] w-px bg-white/10" />
        <div className="absolute inset-y-0 right-[14%] w-px bg-white/10" />

        <div
          className={`absolute top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border transition-all duration-150 ${
            phase === "active"
              ? "scale-100 border-cyan-200 bg-cyan-300 shadow-[0_0_40px_rgba(103,232,249,0.6)]"
              : "scale-90 border-white/10 bg-white/10"
          } ${targetSide === "left" ? "left-[16%]" : "right-[16%]"}`}
        />

        <div className="pointer-events-none absolute bottom-6 left-1/2 w-[74%] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/72 px-4 py-3 text-center backdrop-blur">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-cyan-300/80">
            {phase === "active" ? "TAP NOW" : "READY"}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-200">
            {lastReactionMs ? `최근 반응 ${lastReactionMs}ms` : `적중 ${hits} / 놓침 ${misses}`}
          </div>
        </div>
      </button>
    </StageSurface>
  );
}

function FocusStage({ duration, onProgress, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [round, setRound] = useState(() => createFocusRound());
  const [lastLatency, setLastLatency] = useState(null);
  const roundStartedAtRef = useRef(performance.now());
  const roundTimeoutRef = useRef(null);
  const latencyValuesRef = useRef([]);
  const doneRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, Number((prev - 0.1).toFixed(1))));
    }, 100);

    return () => {
      doneRef.current = true;
      window.clearInterval(timer);
      if (roundTimeoutRef.current) window.clearTimeout(roundTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    roundStartedAtRef.current = performance.now();
    if (roundTimeoutRef.current) window.clearTimeout(roundTimeoutRef.current);

    roundTimeoutRef.current = window.setTimeout(() => {
      setWrong((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 25));
      setRound(createFocusRound());
    }, 2600);
  }, [round]);

  useEffect(() => {
    onProgress({ score, timeLeft });
  }, [onProgress, score, timeLeft]);

  useEffect(() => {
    if (timeLeft > 0 || doneRef.current) return;
    doneRef.current = true;

    const avgPickMs = latencyValuesRef.current.length
      ? Math.round(latencyValuesRef.current.reduce((sum, item) => sum + item, 0) / latencyValuesRef.current.length)
      : null;

    onComplete({
      id: "focus",
      title: "선택적 주의",
      score,
      duration,
      metrics: {
        correct,
        wrong,
        avgPickMs,
      },
      feedback:
        correct >= wrong * 2
          ? "방해 요소 속에서도 목표를 잘 골라냈어요."
          : "시선이 흔들리며 오답이 늘어났어요. 한 지점 고정이 중요합니다.",
    });
  }, [correct, duration, onComplete, score, timeLeft, wrong]);

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

    setRound(createFocusRound());
  };

  return (
    <StageSurface
      icon={Crosshair}
      title="다른 모양 1개 찾기"
      description="같은 카드 사이에서 하나만 다른 모양을 빠르게 골라주세요."
      score={score}
      timeLeft={timeLeft}
      accent="orange"
    >
      <div className="mx-auto mt-4 w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400">현재 미션</div>
            <div className="text-lg font-black text-orange-300">다른 모양 찾기</div>
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
              className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl transition-transform active:scale-95"
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

function createFocusRound() {
  const symbolPool = ["●", "▲", "■", "◆"];
  const targetSymbol = symbolPool[Math.floor(Math.random() * symbolPool.length)];
  const distractorCandidates = symbolPool.filter((symbol) => symbol !== targetSymbol);
  const distractorSymbol = distractorCandidates[Math.floor(Math.random() * distractorCandidates.length)];
  const targetIndex = Math.floor(Math.random() * 9);
  const cells = Array.from({ length: 9 }, (_, index) => (index === targetIndex ? targetSymbol : distractorSymbol));

  return {
    seed: `${targetSymbol}-${distractorSymbol}-${targetIndex}-${Date.now()}`,
    targetIndex,
    cells,
  };
}

function FlowStage({ duration, onProgress, onComplete }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);
  const timeLeftRef = useRef(duration);
  const doneRef = useRef(false);
  const touchZoneRef = useRef(null);
  const activePointerIdRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState(duration);
  const [falls, setFalls] = useState(0);
  const [score, setScore] = useState(0);
  const [alertMsg, setAlertMsg] = useState(null);

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

    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * (CANVAS_WIDTH - type.width - 20) + 10;
    return { x, y, width: type.width, height: 12, color: type.color, passed: false };
  };

  useEffect(() => {
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
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (gameState.current.isPaused || gameState.current.isDone) return;
      const next = Math.max(0, Number((timeLeftRef.current - 0.1).toFixed(1)));
      timeLeftRef.current = next;
      setTimeLeft(next);
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    onProgress({ score, timeLeft });
  }, [onProgress, score, timeLeft]);

  useEffect(() => {
    if (timeLeft > 0 || doneRef.current) return;
    doneRef.current = true;
    gameState.current.isDone = true;

    onComplete({
      id: "flow",
      title: "지속 집중",
      score,
      duration,
      metrics: {
        falls,
        peakScore: score,
      },
      feedback:
        falls <= 1 ? "몰입 리듬을 끝까지 잘 유지했어요." : "리듬이 자주 끊겼어요. 짧은 휴식 전환이 필요해 보입니다.",
    });
  }, [duration, falls, onComplete, score, timeLeft]);

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
      title="리듬을 놓치지 않고 이어가기"
      description="왼쪽과 오른쪽을 눌러 발판을 타고 오르세요. 떨어지면 흐름이 끊깁니다."
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
      </div>
    </StageSurface>
  );
}

function StageSurface({ icon: Icon, title, description, score, timeLeft, accent, children, noPad = false }) {
  const accentClasses = {
    cyan: "text-cyan-300 border-cyan-300/20 bg-cyan-400/10",
    orange: "text-orange-300 border-orange-300/20 bg-orange-400/10",
    emerald: "text-emerald-300 border-emerald-300/20 bg-emerald-400/10",
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-3">
        <div className={`mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${accentClasses[accent]}`}>
          <Icon className="mr-1.5 h-4 w-4" />
          {title}
        </div>

        <div className="mb-4 flex items-end justify-between gap-4">
          <p className="max-w-[15rem] text-sm font-medium leading-relaxed text-slate-300">{description}</p>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-500">현재 점수</div>
            <div className="text-3xl font-black text-white">{Math.round(score).toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-extrabold text-slate-400">
          <span>이 단계 남은 시간</span>
          <span>{Math.ceil(timeLeft)}초</span>
        </div>
      </div>

      <div className={`flex-1 ${noPad ? "" : "px-5 pb-5"}`}>{children}</div>
    </div>
  );
}

function getStageLabel(stageId) {
  if (stageId === "reaction") return "반응 속도";
  if (stageId === "focus") return "선택적 주의";
  if (stageId === "flow") return "지속 집중";
  return "집중 측정";
}
