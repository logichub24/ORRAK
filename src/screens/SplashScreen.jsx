import React, { useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { SoundManager } from "../lib/soundManager";

export function SplashScreen({ onDone }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1800);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-cyan-50 to-white text-slate-900"
      onClick={() => SoundManager.init()}
    >
      <div className="absolute inset-0 flex justify-around opacity-30">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="h-32 w-1 animate-pulse rounded-full bg-cyan-200"
            style={{
              animationDelay: `${index * 0.2}s`,
              transform: `translateY(${Math.random() * 100}px)`,
            }}
          />
        ))}
      </div>

      <div className="z-10 flex animate-bounce-slow flex-col items-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-cyan-400 bg-white shadow-[0_4px_20px_rgba(6,182,212,0.15)]">
          <ArrowUp className="h-14 w-14 text-cyan-500" strokeWidth={3} />
        </div>
        <h1 className="mb-3 text-5xl font-black tracking-tight">오르락</h1>
        <p className="mb-8 text-lg font-extrabold text-cyan-600">오늘의 집중력을 올려라</p>
        <div className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-600 shadow-sm">
          본 앱은 게임이 아닌 두뇌 컨디션 체크 앱입니다
        </div>
      </div>
    </div>
  );
}
