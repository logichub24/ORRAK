import React from "react";
import { getAdConfig, hasLiveAdUnit } from "../config/launchConfig";
import { mountBannerAd } from "../lib/adBridge";

export function BannerAd() {
  const bannerConfig = getAdConfig("banner");
  const isLive = hasLiveAdUnit("banner");
  const containerId = "orrak-banner-slot";

  React.useEffect(() => {
    if (!isLive) return;

    mountBannerAd({
      unitId: bannerConfig?.unitId,
      placement: bannerConfig?.placement,
      containerId,
    });
  }, [bannerConfig?.placement, bannerConfig?.unitId, isLive]);

  return (
    <div
      id={containerId}
      className="relative h-14 w-full shrink-0 overflow-hidden border-t border-slate-200 bg-slate-200/90"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="flex h-full flex-col items-center justify-center text-slate-500">
        <div className="text-[10px] font-black tracking-[0.18em]">SPONSORED</div>
        <div className="mt-0.5 text-[11px] font-extrabold tracking-[0.12em]">
          {isLive ? "오늘의 스폰서 배너" : "배너 광고 자리 준비 중"}
        </div>
        {!isLive && bannerConfig?.placement ? (
          <div className="mt-0.5 text-[9px] font-bold tracking-[0.08em] text-slate-400">
            {bannerConfig.placement}
          </div>
        ) : null}
      </div>
    </div>
  );
}
