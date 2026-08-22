import React, { useEffect, useState } from "react";
import { Video, XCircle } from "lucide-react";
import { SoundManager } from "../lib/soundManager";

export function AdOverlay({ type, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(type === "reward" ? 5 : 3);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanClose(true);
      SoundManager.playSuccess();
      return undefined;
    }

    const timer = window.setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [timeLeft]);

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-6 text-white">
      <div className="absolute right-6 top-6">
        {canClose ? (
          <button
            onClick={() => {
              SoundManager.playClick();
              onComplete(true);
            }}
            className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
          >
            <XCircle className="h-8 w-8" />
          </button>
        ) : (
          <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">
            {timeLeft}\uCD08 \uD6C4 \uB2EB\uAE30
          </div>
        )}
      </div>

      <div className="text-center">
        <Video className="mx-auto mb-6 h-16 w-16 animate-pulse text-cyan-400" />
        <h3 className="mb-3 text-2xl font-black">
          {type === "reward" ? "\uB9AC\uC6CC\uB4DC \uAD11\uACE0 \uC7AC\uC0DD \uC911" : "\uC804\uBA74 \uC2A4\uD3F0\uC11C \uAD11\uACE0"}
        </h3>
        <p className="text-sm font-medium text-slate-400">
          {type === "reward"
            ? "\uAD11\uACE0\uB97C \uC2DC\uCCAD\uD558\uC2DC\uBA74 \uCD94\uAC00 \uAE30\uD68C\uB098 \uC2EC\uCE35 \uBD84\uC11D \uBCF4\uC0C1\uC744 \uB4DC\uB9BD\uB2C8\uB2E4."
            : "\uD558\uB8E8 \uCCAB \uACB0\uACFC \uC9C4\uC785 \uC804\uC5D0\uB9CC \uBCF4\uC5EC\uB4DC\uB9AC\uB294 \uAC00\uBCBC\uC6B4 \uC2A4\uD3F0\uC11C \uAD11\uACE0\uC608\uC694."}
        </p>

        {canClose && type === "reward" ? (
          <button
            onClick={() => {
              SoundManager.playClick();
              onComplete(true);
            }}
            className="mt-10 rounded-2xl bg-cyan-500 px-10 py-4 text-lg font-black text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            \uBCF4\uC0C1 \uBC1B\uACE0 \uACC4\uC18D\uD558\uAE30
          </button>
        ) : null}
      </div>
    </div>
  );
}
