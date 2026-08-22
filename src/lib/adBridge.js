import { loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";

const loadedAdGroups = new Set();
const loadingPromises = new Map();

function hasWindow() {
  return typeof window !== "undefined";
}

function isOneStoreRuntime() {
  return hasWindow() && window.__ORRAK_DISTRIBUTION === "onestore" && Boolean(window.OrrakAds);
}

let nativeRequestSequence = 0;

function showNativeAd(type) {
  return new Promise((resolve) => {
    const requestId = `orrak-ad-${Date.now()}-${nativeRequestSequence += 1}`;
    const timeout = window.setTimeout(() => {
      delete window.__orrakAdCallbacks?.[requestId];
      resolve({ shown: false, rewarded: false, completed: false, reason: "native_timeout" });
    }, 45000);

    window.__orrakAdCallbacks = window.__orrakAdCallbacks || {};
    window.__orrakAdCallbacks[requestId] = (result) => {
      window.clearTimeout(timeout);
      delete window.__orrakAdCallbacks[requestId];
      resolve(result);
    };

    window.OrrakAds.show(type, requestId);
  });
}

if (hasWindow()) {
  window.__orrakAdBridgeResolve = (requestId, payload) => {
    const callback = window.__orrakAdCallbacks?.[requestId];
    if (!callback) return;
    try {
      callback(JSON.parse(payload));
    } catch {
      callback({ shown: false, rewarded: false, completed: false, reason: "invalid_native_response" });
    }
  };
}

function isTossRuntime() {
  if (!hasWindow()) return false;

  const userAgent = window.navigator?.userAgent || "";
  const host = window.location?.hostname || "";

  if (host === "127.0.0.1" || host === "localhost") {
    return false;
  }

  return /Toss|AppsInToss|TossApp/i.test(userAgent) || Boolean(window.__appsInToss || window.__TOSS_APP__);
}

function safeIsSupported(fn) {
  try {
    if (!isTossRuntime()) return false;
    return Boolean(fn?.isSupported?.());
  } catch {
    return false;
  }
}

export function getAdRuntimeInfo() {
  return {
    available: hasWindow(),
    loadSupported: safeIsSupported(loadFullScreenAd),
    showSupported: safeIsSupported(showFullScreenAd),
  };
}

export function shouldUseDevAdFallback() {
  if (!hasWindow()) return false;
  if (safeIsSupported(showFullScreenAd)) return false;

  const host = window.location.hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "211.224.19.51";
}

function loadAd(adGroupId) {
  if (loadedAdGroups.has(adGroupId)) {
    return Promise.resolve({ loaded: true, reason: "already_loaded" });
  }

  if (loadingPromises.has(adGroupId)) {
    return loadingPromises.get(adGroupId);
  }

  const promise = new Promise((resolve, reject) => {
    if (!safeIsSupported(loadFullScreenAd)) {
      reject(new Error("load_full_screen_ad_unsupported"));
      return;
    }

    let settled = false;
    let unsubscribe = () => {};

    const settleResolve = (value) => {
      if (settled) return;
      settled = true;
      loadedAdGroups.add(adGroupId);
      loadingPromises.delete(adGroupId);
      unsubscribe();
      resolve(value);
    };

    const settleReject = (error) => {
      if (settled) return;
      settled = true;
      loadingPromises.delete(adGroupId);
      unsubscribe();
      reject(error);
    };

    unsubscribe = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event?.type === "loaded") {
          settleResolve({ loaded: true, event });
        }
      },
      onError: settleReject,
    });
  });

  loadingPromises.set(adGroupId, promise);
  return promise;
}

function showAd(adGroupId) {
  return new Promise((resolve) => {
    if (!safeIsSupported(showFullScreenAd)) {
      resolve({
        shown: false,
        rewarded: false,
        completed: false,
        reason: "show_full_screen_ad_unsupported",
      });
      return;
    }

    let settled = false;
    let didReward = false;
    let didShow = false;
    let unsubscribe = () => {};

    const settle = (value) => {
      if (settled) return;
      settled = true;
      loadedAdGroups.delete(adGroupId);
      unsubscribe();
      resolve(value);
    };

    unsubscribe = showFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        switch (event?.type) {
          case "requested":
          case "show":
          case "impression":
          case "clicked":
            didShow = true;
            break;
          case "userEarnedReward":
            didShow = true;
            didReward = true;
            break;
          case "dismissed":
            settle({
              shown: true,
              rewarded: didReward,
              completed: true,
              reason: "dismissed",
            });
            break;
          case "failedToShow":
            settle({
              shown: didShow,
              rewarded: false,
              completed: false,
              reason: "failed_to_show",
            });
            break;
          default:
            break;
        }
      },
      onError: (error) =>
        settle({
          shown: false,
          rewarded: false,
          completed: false,
          reason: "show_failed",
          error,
        }),
    });
  });
}

export async function preloadFullScreenAd(unitId) {
  if (!unitId) {
    return { loaded: false, reason: "config_missing" };
  }

  if (isOneStoreRuntime()) {
    window.OrrakAds.preload();
    return { loaded: true };
  }

  try {
    await loadAd(unitId);
    return { loaded: true };
  } catch (error) {
    return { loaded: false, reason: "load_failed", error };
  }
}

export async function showInterstitialAd({ unitId }) {
  if (!unitId) {
    return { shown: false, completed: false, reason: "config_missing" };
  }

  if (isOneStoreRuntime()) {
    return showNativeAd("interstitial");
  }

  try {
    await preloadFullScreenAd(unitId);
    return await showAd(unitId);
  } catch (error) {
    return {
      shown: false,
      rewarded: false,
      completed: false,
      reason: "load_failed",
      error,
    };
  }
}

export async function showRewardAd({ unitId }) {
  if (!unitId) {
    return { shown: false, rewarded: false, completed: false, reason: "config_missing" };
  }

  if (isOneStoreRuntime()) {
    return showNativeAd("rewarded");
  }

  try {
    await preloadFullScreenAd(unitId);
    return await showAd(unitId);
  } catch (error) {
    return {
      shown: false,
      rewarded: false,
      completed: false,
      reason: "load_failed",
      error,
    };
  }
}
