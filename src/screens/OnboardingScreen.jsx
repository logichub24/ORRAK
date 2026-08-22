import React, { useMemo, useState } from "react";
import { ArrowRight, Brain, ChartColumnIncreasing, ListChecks } from "lucide-react";
import { SoundManager } from "../lib/soundManager";

const STEPS = [
  {
    badge: "60초 체크",
    title: "중요한 일 시작 전\n집중 상태부터 확인합니다",
    body: "반응, 주의, 몰입을 60초 안에 확인하고 오늘 컨디션을 바로 파악합니다.",
    icon: Brain,
  },
  {
    badge: "오늘의 결정",
    title: "점수보다 먼저\n지금 할 일을 추천합니다",
    body: "측정 직후 오늘 하면 좋은 일과 피하면 좋은 일을 바로 정리해줍니다.",
    icon: ListChecks,
  },
  {
    badge: "기록 자산",
    title: "기록이 쌓일수록\n내 패턴이 더 정확해집니다",
    body: "강한 시간대, 위험 신호, 성장 흐름이 쌓여서 일정 결정이 점점 쉬워집니다.",
    icon: ChartColumnIncreasing,
  },
];

export function OnboardingScreen({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = useMemo(() => STEPS[stepIndex], [stepIndex]);
  const Icon = step.icon;
  const isLast = stepIndex === STEPS.length - 1;

  const goNext = () => {
    SoundManager.playClick();
    if (isLast) {
      onDone();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_42%),linear-gradient(180deg,_#f8fdff_0%,_#eef7ff_55%,_#f8fbff_100%)] px-6 pb-8 pt-6 text-slate-950">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-black tracking-[0.18em] text-cyan-700">ORRAK START</div>
        <button
          onClick={() => {
            SoundManager.playClick();
            onDone();
          }}
          className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[12px] font-extrabold text-slate-600 shadow-sm"
        >
          건너뛰기
        </button>
      </div>

      <div className="mt-7 rounded-[2rem] border border-cyan-100 bg-white/88 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-cyan-200 bg-cyan-50 shadow-[0_12px_30px_rgba(34,211,238,0.16)]">
          <Icon className="h-10 w-10 text-cyan-600" />
        </div>

        <div className="mt-5 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black text-cyan-700">
          {step.badge}
        </div>

        <div className="reading-flow mt-4 whitespace-pre-line text-[30px] font-black leading-[1.2] tracking-tight text-slate-950">
          {step.title}
        </div>
        <div className="mt-4 text-[15px] font-semibold leading-7 text-slate-600">{step.body}</div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-[11px] font-black tracking-[0.16em] text-slate-500">앱 가치</div>
          <div className="mt-2 text-[18px] font-black leading-snug text-slate-900">
            {stepIndex === 0 ? "측정은 짧게, 판단은 빠르게" : stepIndex === 1 ? "오늘의 일 우선순위를 바로 결정" : "내 기록이 쌓일수록 더 똑똑한 추천"}
          </div>
          <div className="mt-2 text-[13px] font-semibold leading-6 text-slate-600">
            {stepIndex === 0
              ? "회원가입 없이 바로 시작하고, 첫 측정만으로 오늘 컨디션을 확인합니다."
              : stepIndex === 1
                ? "결과를 보는 데서 끝나지 않고 지금 해야 할 행동으로 바로 이어집니다."
                : "오르락은 쓸수록 정확도가 올라가는 집중력 기록 도구로 동작합니다."}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {STEPS.map((item, index) => (
          <div
            key={item.badge}
            className={`h-2.5 rounded-full transition-all ${index === stepIndex ? "w-8 bg-cyan-500" : "w-2.5 bg-slate-300"}`}
          />
        ))}
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={goNext}
          className="flex w-full items-center justify-center rounded-[1.4rem] bg-cyan-500 px-5 py-4 text-[18px] font-black text-white shadow-[0_14px_34px_rgba(6,182,212,0.28)] transition-colors hover:bg-cyan-600"
        >
          {isLast ? "바로 시작하기" : "다음"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
