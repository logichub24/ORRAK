import React from "react";
import { TossAds } from "@apps-in-toss/web-framework";
import { getAdConfig, hasLiveAdUnit } from "../config/launchConfig";

let bannerSdkInitialized = false;

function safeBannerSupport(methodName) {
  try {
    return Boolean(TossAds?.[methodName]?.isSupported?.());
  } catch {
    return false;
  }
}

function ensureBannerSdk() {
  if (bannerSdkInitialized) return true;
  if (!safeBannerSupport("initialize")) return false;

  TossAds.initialize({
    callbacks: {
      onInitialized: () => {
        bannerSdkInitialized = true;
      },
      onInitializationFailed: () => {
        bannerSdkInitialized = false;
      },
    },
  });

  bannerSdkInitialized = true;
  return true;
}

export function BannerAd() {
  const bannerConfig = getAdConfig("banner");
  const isLive = hasLiveAdUnit("banner");
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!isLive || !bannerConfig?.unitId || !containerRef.current) return undefined;
    if (!safeBannerSupport("attachBanner")) return undefined;
    if (!ensureBannerSdk()) return undefined;

    const banner = TossAds.attachBanner(bannerConfig.unitId, containerRef.current, {
      theme: "auto",
      tone: "grey",
      variant: "expanded",
    });

    return () => {
      banner?.destroy?.();
    };
  }, [bannerConfig?.unitId, isLive]);

  return (
    <div className="w-full shrink-0 border-t border-slate-200 bg-white px-2 py-2">
      <div
        ref={containerRef}
        className={`relative min-h-[56px] w-full overflow-hidden rounded-xl ${
          isLive ? "bg-white" : "border border-slate-200 bg-slate-200/90"
        }`}
      >
        {!isLive ? (
          <>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="flex h-full min-h-[56px] flex-col items-center justify-center text-slate-500">
              <div className="text-[10px] font-black tracking-[0.18em]">SPONSORED</div>
              <div className="mt-0.5 text-[11px] font-extrabold tracking-[0.12em]">배너 광고 준비 중</div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
