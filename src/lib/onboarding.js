const ONBOARDING_KEY = "orrak-onboarding-complete-v1";

export function hasCompletedOnboarding() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function completeOnboarding() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // noop
  }
}

export function resetOnboarding() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // noop
  }
}
