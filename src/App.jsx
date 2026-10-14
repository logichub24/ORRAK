import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { graniteEvent, Screen } from "@apps-in-toss/web-framework";
import { BarChart2, Home, Sparkles } from "lucide-react";
import { AdOverlay } from "./components/AdOverlay";
import { useDataService } from "./hooks/useDataService";
import { preloadFullScreenAd, shouldUseDevAdFallback, showInterstitialAd, showRewardAd } from "./lib/adBridge";
import { trackAppOpen, trackEvent } from "./lib/analytics";
import { getAdConfig, getDistributionChannel, hasLiveAdUnit } from "./config/launchConfig";
import { getToday, getPastDate, getYesterday } from "./lib/date";
import { createLhAiEngine } from "./lib/lhAiEngine";
import { getFocusLevel } from "./lib/progression";
import { saveResultToData } from "./lib/storage";
import { AiCoachScreen } from "./screens/AiCoachScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MeasureScreen } from "./screens/MeasureScreen";
import { RecordScreen } from "./screens/RecordScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { completeOnboarding, hasCompletedOnboarding, resetOnboarding } from "./lib/onboarding";

function BottomNavigation({ screen, onHome, onCoach, onMeasure, onRecord }) {
  return (
    <div className="bg-white px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
      <div className="grid h-[62px] grid-cols-[1fr_auto_1fr_1fr] items-center gap-1.5">
        <button
          onClick={onHome}
          className={`flex h-full flex-col items-center justify-center rounded-2xl px-2 py-1.5 text-[11px] font-extrabold leading-none transition-colors ${
            screen === "home" ? "bg-slate-100 text-slate-950" : "text-slate-500"
          }`}
        >
          <Home className={`mb-1 h-5 w-5 ${screen === "home" ? "text-cyan-600" : "text-slate-700"}`} />
          <span className="whitespace-nowrap">홈</span>
        </button>

        <button
          onClick={onMeasure}
          className="flex h-[54px] min-w-[128px] items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-[16px] font-black leading-none text-white shadow-[0_6px_18px_rgba(6,182,212,0.35)] transition-colors hover:bg-cyan-600"
        >
          <span className="whitespace-nowrap">지금 측정</span>
        </button>

        <button
          onClick={onCoach}
          className={`flex h-full flex-col items-center justify-center rounded-2xl px-1.5 py-1.5 text-[10.5px] font-extrabold leading-none transition-colors ${
            screen === "coach" ? "bg-violet-50 text-violet-900" : "text-slate-500"
          }`}
        >
          <Sparkles className={`mb-1 h-5 w-5 ${screen === "coach" ? "text-violet-600" : "text-violet-700"}`} />
          <span className="whitespace-nowrap">집중코치</span>
        </button>

        <button
          onClick={onRecord}
          className={`flex h-full flex-col items-center justify-center rounded-2xl px-2 py-1.5 text-[11px] font-extrabold leading-none transition-colors ${
            screen === "record" ? "bg-slate-100 text-slate-950" : "text-slate-500"
          }`}
        >
          <BarChart2 className={`mb-1 h-5 w-5 ${screen === "record" ? "text-cyan-600" : "text-slate-700"}`} />
          <span className="whitespace-nowrap">기록</span>
        </button>
      </div>
    </div>
  );
}
async function runInterstitialOrFallback({ onComplete }) {
  const config = getAdConfig("interstitial");

  if (hasLiveAdUnit("interstitial")) {
    await showInterstitialAd({
      unitId: config.unitId,
      placement: config.placement,
    });
    onComplete();
    return;
  }

  onComplete();
}

async function runRewardOrFallback({ onFallbackOverlay, onRewarded }) {
  const config = getAdConfig("reward");

  if (hasLiveAdUnit("reward")) {
    const result = await showRewardAd({
      unitId: config.unitId,
      placement: config.placement,
    });

    if (result.shown) {
      trackEvent("reward_ad_shown", { rewarded: result.rewarded });
      if (result.rewarded) {
        trackEvent("reward_ad_rewarded");
        onRewarded();
      }
      return;
    }
  }

  if (!hasLiveAdUnit("reward")) {
    trackEvent("reward_unlocked_without_ad", {
      distribution: getDistributionChannel(),
    });
    onRewarded();
    return;
  }

  if (shouldUseDevAdFallback()) {
    onFallbackOverlay();
  }
}

function shouldShowResultInterstitial(totalPlays) {
  if (totalPlays < 1) return false;
  if (getDistributionChannel() === "onestore" && (totalPlays + 1) % 2 !== 0) return false;

  const lastShownAt = Number(window.localStorage.getItem("orrak-last-result-ad-at") || 0);
  return Date.now() - lastShownAt >= 10 * 60 * 1000;
}

export default function App() {
  const [screen, setScreen] = useState("splash");
  const screenHistoryRef = useRef([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [adState, setAdState] = useState(null);
  const [insightsUnlocked, setInsightsUnlocked] = useState(false);
  const [coachInitialTab, setCoachInitialTab] = useState("schedule");
  const [needsOnboarding, setNeedsOnboarding] = useState(() => !hasCompletedOnboarding());
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window === "undefined") return null;
    return Math.round(window.visualViewport?.height || window.innerHeight || 0);
  });
  const dataService = useDataService();
  const engine = useMemo(() => createLhAiEngine(), []);

  const navigate = useCallback((nextScreen, { replace = false, reset = false } = {}) => {
    setScreen((currentScreen) => {
      if (currentScreen === nextScreen) return currentScreen;

      if (reset) {
        screenHistoryRef.current = [];
      } else if (!replace) {
        screenHistoryRef.current.push(currentScreen);
      }

      return nextScreen;
    });
  }, []);

  const goBack = useCallback(() => {
    const previousScreen = screenHistoryRef.current.pop();
    if (!previousScreen) return false;

    setScreen(previousScreen);
    return true;
  }, []);

  useEffect(() => {
    try {
      return graniteEvent.addEventListener("backEvent", {
        onEvent: () => {
          if (!goBack()) {
            try {
              Screen.close().catch(() => undefined);
            } catch {
              // 웹 브라우저에서는 종료 브리지가 없을 수 있어요.
            }
          }
        },
      });
    } catch {
      return undefined;
    }
  }, [goBack]);

  useEffect(() => {
    trackAppOpen({ initialScreen: screen, distribution: getDistributionChannel() });
  }, []);

  useEffect(() => {
    trackEvent("screen_view", { screen });
  }, [screen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateViewportHeight = () => {
      const nextHeight = Math.round(window.visualViewport?.height || window.innerHeight || 0);
      if (nextHeight > 0) {
        setViewportHeight(nextHeight);
      }
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);
    window.visualViewport?.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const interstitialConfig = getAdConfig("interstitial");
    const rewardConfig = getAdConfig("reward");

    if (hasLiveAdUnit("interstitial")) {
      preloadFullScreenAd(interstitialConfig.unitId);
    }

    if (hasLiveAdUnit("reward")) {
      preloadFullScreenAd(rewardConfig.unitId);
    }
  }, []);

  useEffect(() => {
    if (screen === "home" || screen === "measure") {
      const interstitialConfig = getAdConfig("interstitial");
      if (hasLiveAdUnit("interstitial")) {
        preloadFullScreenAd(interstitialConfig.unitId);
      }
    }

    if (screen === "result" || screen === "coach") {
      const rewardConfig = getAdConfig("reward");
      if (hasLiveAdUnit("reward")) {
        preloadFullScreenAd(rewardConfig.unitId);
      }
    }
  }, [screen]);


  const handleMeasureDone = async (result) => {
    trackEvent("measure_complete", { score: result.score, duration: result.duration, falls: result.falls });
    const existingRecords = dataService.data.records || [];
    const today = getToday();
    const todayRecord = existingRecords.find((record) => record.date === today);
    const previousAllTimeBest = existingRecords.reduce((max, record) => Math.max(max, record.score), 0);
    const weekStart = getPastDate(6);
    const previousWeekBest = existingRecords
      .filter((record) => record.date >= weekStart)
      .reduce((max, record) => Math.max(max, record.score), 0);
    const previousLevelInfo = getFocusLevel(
      existingRecords.length,
      previousAllTimeBest,
      dataService.data.streak || 0,
      dataService.data.totalPlays || 0
    );

    const nextData = saveResultToData(dataService.data, result);
    const nextAllTimeBest = nextData.records.reduce((max, record) => Math.max(max, record.score), 0);
    const nextLevelInfo = getFocusLevel(
      nextData.records.length,
      nextAllTimeBest,
      nextData.streak || 0,
      nextData.totalPlays || 0
    );
    const nextStreak =
      dataService.data.lastDate === getYesterday()
        ? (dataService.data.streak || 0) + 1
        : dataService.data.lastDate === today
          ? dataService.data.streak || 0
          : 1;

    const resultWithAchievements = {
      ...result,
      achievements: {
        beatTodayBest: Boolean(todayRecord && result.score > todayRecord.score),
        isNewAllTimeBest: result.score > previousAllTimeBest,
        isNewWeeklyBest: result.score > previousWeekBest,
        unlocked7DayBadge: nextStreak >= 7 && (dataService.data.streak || 0) < 7,
        nextStreak,
        didLevelUp: nextLevelInfo.level > previousLevelInfo.level,
        previousLevel: previousLevelInfo.level,
        newLevel: nextLevelInfo.level,
        newLevelTitle: nextLevelInfo.title,
      },
    };

    const openResult = () => {
      setAdState(null);
      setInsightsUnlocked(false);
      dataService.saveResult(result);
      setCurrentResult(resultWithAchievements);
      navigate("result", { replace: true });
    };

    const shouldShowInterstitial =
      hasLiveAdUnit("interstitial") && shouldShowResultInterstitial(dataService.data.totalPlays || 0);

    if (shouldShowInterstitial) {
      if (getDistributionChannel() === "onestore") {
        window.localStorage.setItem("orrak-last-result-ad-at", String(Date.now()));
      }
      trackEvent("interstitial_requested", { phase: "before_result_frequency_capped" });
      await runInterstitialOrFallback({
        onComplete: openResult,
      });
      return;
    }

    openResult();
  };

  const handleRetry = async () => {
    trackEvent("result_revisit_cta_click", { action: "retry_measure" });
    trackEvent("reward_requested", { feature: "retry_measure" });
    await runRewardOrFallback({
      onRewarded: () => {
        navigate("measure");
      },
      onFallbackOverlay: () =>
        setAdState({
          type: "reward",
          onComplete: (success) => {
            setAdState(null);
            if (success) {
              navigate("measure");
            }
          },
        }),
    });
  };

  const handleUnlockInsights = async () => {
    trackEvent("reward_requested", { feature: "deep_analysis" });
    await runRewardOrFallback({
      onRewarded: () => {
        setInsightsUnlocked(true);
      },
      onFallbackOverlay: () =>
        setAdState({
          type: "reward",
          onComplete: (success) => {
            setAdState(null);
            if (success) {
              setInsightsUnlocked(true);
            }
          },
        }),
    });
  };

  const handleSplashDone = () => {
    navigate("home", { reset: true });
  };

  const handleOnboardingDone = () => {
    completeOnboarding();
    setNeedsOnboarding(false);
    navigate("home", { reset: true });
  };

  const handleReplayOnboarding = () => {
    resetOnboarding();
    setNeedsOnboarding(true);
    navigate("onboarding");
  };

  const showBottomNav = screen !== "splash" && screen !== "measure" && screen !== "onboarding";
  const bottomDockHeight = showBottomNav ? 94 : 0;

  return (
    <div
      className="relative mx-auto flex w-full max-w-md flex-col overflow-hidden bg-slate-50 font-sans shadow-2xl"
      style={
        viewportHeight
          ? {
              height: `${viewportHeight}px`,
              minHeight: `${viewportHeight}px`,
              maxHeight: `${viewportHeight}px`,
            }
          : undefined
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ paddingBottom: `${bottomDockHeight}px` }}>
        {screen === "splash" ? <SplashScreen onDone={handleSplashDone} /> : null}
        {screen === "onboarding" ? <OnboardingScreen onDone={handleOnboardingDone} /> : null}
        {screen === "home" ? (
          <HomeScreen
            onStart={() => navigate("measure")}
            onRecord={() => navigate("record")}
            onCoach={(tab) => {
              setCoachInitialTab(tab || "schedule");
              navigate("coach");
            }}
            dataService={dataService}
          />
        ) : null}
        {screen === "coach" ? (
          <AiCoachScreen
            onBack={goBack}
            engine={engine}
            dataService={dataService}
            initialTab={coachInitialTab}
          />
        ) : null}
        {screen === "measure" ? <MeasureScreen onDone={handleMeasureDone} /> : null}
        {screen === "result" && currentResult ? (
          <ResultScreen
            result={currentResult}
            onHome={() => navigate("home", { reset: true })}
            onRetry={handleRetry}
            onUnlockInsights={handleUnlockInsights}
            insightsUnlocked={insightsUnlocked}
            engine={engine}
            dataService={dataService}
            preferredAgeGroup={dataService.data.profile.preferredAgeGroup}
            onCoach={(tab) => {
              setCoachInitialTab(tab || "schedule");
              navigate("coach");
            }}
          />
        ) : null}
        {screen === "record" ? (
          <RecordScreen
            onBack={goBack}
            dataService={dataService}
            engine={engine}
            onReplayOnboarding={handleReplayOnboarding}
          />
        ) : null}
      </div>

      {showBottomNav ? (
        <div className="absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-20 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.18)]">
          {showBottomNav ? (
            <BottomNavigation
              screen={screen}
              onHome={() => navigate("home", { reset: true })}
              onCoach={() => {
                setCoachInitialTab("schedule");
                navigate("coach");
              }}
              onMeasure={() => navigate("measure")}
              onRecord={() => navigate("record")}
            />
          ) : null}
        </div>
      ) : null}

      {adState ? <AdOverlay type={adState.type} onComplete={adState.onComplete} /> : null}
    </div>
  );
}
