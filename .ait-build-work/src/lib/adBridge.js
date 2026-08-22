function getRuntime() {
  if (typeof window === "undefined") return null;

  return (
    window.logicHubAds ||
    window.logicHubAdBridge ||
    window.aitAds ||
    window.ait?.ads ||
    window.TossAds ||
    window.tossAds ||
    null
  );
}

function resolveMethod(runtime, names = []) {
  for (const name of names) {
    if (typeof runtime?.[name] === "function") {
      return runtime[name].bind(runtime);
    }
  }
  return null;
}

function isRewardSuccess(result) {
  if (result === true) return true;
  if (result?.rewarded === true) return true;
  if (result?.completed === true) return true;
  if (result?.success === true) return true;
  return false;
}

export function getAdRuntimeInfo() {
  const runtime = getRuntime();
  return {
    available: Boolean(runtime),
    keys: runtime ? Object.keys(runtime) : [],
  };
}

export async function mountBannerAd({ unitId, placement, containerId }) {
  const runtime = getRuntime();
  if (!runtime || !unitId || !containerId) {
    return { mounted: false, reason: "runtime_or_config_missing" };
  }

  const method = resolveMethod(runtime, [
    "mountBanner",
    "showBanner",
    "renderBanner",
    "loadBanner",
  ]);

  if (!method) {
    return { mounted: false, reason: "banner_method_missing" };
  }

  try {
    const result = await method({
      unitId,
      placement,
      containerId,
    });

    return {
      mounted: result !== false,
      result,
    };
  } catch (error) {
    return {
      mounted: false,
      reason: "banner_mount_failed",
      error,
    };
  }
}

export async function showInterstitialAd({ unitId, placement }) {
  const runtime = getRuntime();
  if (!runtime || !unitId) {
    return { shown: false, completed: false, reason: "runtime_or_config_missing" };
  }

  const method = resolveMethod(runtime, [
    "showInterstitial",
    "openInterstitial",
    "interstitial",
    "showFullScreenAd",
  ]);

  if (!method) {
    return { shown: false, completed: false, reason: "interstitial_method_missing" };
  }

  try {
    const result = await method({
      unitId,
      placement,
    });

    return {
      shown: true,
      completed: result !== false,
      result,
    };
  } catch (error) {
    return {
      shown: false,
      completed: false,
      reason: "interstitial_failed",
      error,
    };
  }
}

export async function showRewardAd({ unitId, placement }) {
  const runtime = getRuntime();
  if (!runtime || !unitId) {
    return { shown: false, rewarded: false, reason: "runtime_or_config_missing" };
  }

  const method = resolveMethod(runtime, [
    "showRewarded",
    "showReward",
    "openRewarded",
    "rewarded",
  ]);

  if (!method) {
    return { shown: false, rewarded: false, reason: "reward_method_missing" };
  }

  try {
    const result = await method({
      unitId,
      placement,
    });

    return {
      shown: true,
      rewarded: isRewardSuccess(result),
      result,
    };
  } catch (error) {
    return {
      shown: false,
      rewarded: false,
      reason: "reward_failed",
      error,
    };
  }
}
