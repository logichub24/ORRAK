import { grantPromotionReward } from "@apps-in-toss/web-framework";
import { trackEvent } from "./analytics";
import { isOneStoreChannel } from "../config/launchConfig";

export const PROMOTION_REWARD = {
  code: "01KYF498D22G1EPHTT00PZYVJH",
  amount: 5,
};

const PROMOTION_DONE_KEY = `orrak-promotion-reward-done:${PROMOTION_REWARD.code}`;

function getResultRewardKey(result) {
  const score = result?.score ?? 0;
  const duration = result?.duration ?? 0;
  const falls = result?.falls ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  return `orrak-promotion-reward:${PROMOTION_REWARD.code}:${today}:${score}:${duration}:${falls}`;
}

function hasPersistentRewardDone() {
  try {
    return window.localStorage.getItem(PROMOTION_DONE_KEY) === "done";
  } catch {
    return false;
  }
}

function markPersistentRewardDone() {
  try {
    window.localStorage.setItem(PROMOTION_DONE_KEY, "done");
  } catch {
    // ignore
  }
}

function isSupported() {
  try {
    return Boolean(grantPromotionReward?.isSupported?.());
  } catch {
    return false;
  }
}

export async function grantResultPromotionReward(result) {
  if (typeof window === "undefined") {
    return { skipped: true, reason: "no_window" };
  }

  if (isOneStoreChannel()) {
    trackEvent("promotion_reward_skipped", {
      reason: "onestore_channel",
      promotionCode: PROMOTION_REWARD.code,
    });
    return { skipped: true, reason: "onestore_channel" };
  }

  if (hasPersistentRewardDone()) {
    return { skipped: true, reason: "already_granted" };
  }

  const rewardKey = getResultRewardKey(result);
  if (window.sessionStorage.getItem(rewardKey) === "done") {
    return { skipped: true, reason: "already_requested" };
  }

  const supported = isSupported();
  if (!grantPromotionReward) {
    trackEvent("promotion_reward_skipped", {
      reason: "bridge_missing",
      promotionCode: PROMOTION_REWARD.code,
    });
    return { skipped: true, reason: "bridge_missing" };
  }

  window.sessionStorage.setItem(rewardKey, "done");

  try {
    const response = await grantPromotionReward({
      params: {
        promotionCode: PROMOTION_REWARD.code,
        amount: PROMOTION_REWARD.amount,
      },
    });

    trackEvent("promotion_reward_response", {
      promotionCode: PROMOTION_REWARD.code,
      amount: PROMOTION_REWARD.amount,
      supported,
      response,
      resultType: response?.resultType,
      hasKey: Boolean(response && typeof response === "object" && "key" in response),
      errorCode: response?.errorCode || response?.code,
    });

    console.info("[ORRAK] promotion reward response", response);
    if (response?.resultType === "SUCCESS" || (response && typeof response === "object" && "key" in response)) {
      markPersistentRewardDone();
    }
    return { skipped: false, response };
  } catch (error) {
    window.sessionStorage.removeItem(rewardKey);
    trackEvent("promotion_reward_error", {
      promotionCode: PROMOTION_REWARD.code,
      message: error?.message || String(error),
    });
    console.warn("[ORRAK] promotion reward failed", error);
    return { skipped: false, error };
  }
}
