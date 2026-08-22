const ANALYTICS_KEY = "orrak-analytics-v1";

function loadAnalytics() {
  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          events: [],
        };
  } catch {
    return { events: [] };
  }
}

function saveAnalytics(data) {
  try {
    window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function trackEvent(name, meta = {}) {
  if (typeof window === "undefined") return;

  const analytics = loadAnalytics();
  analytics.events.unshift({
    name,
    meta,
    at: new Date().toISOString(),
  });
  analytics.events = analytics.events.slice(0, 300);
  saveAnalytics(analytics);
}

