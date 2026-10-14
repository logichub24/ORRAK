const ANALYTICS_KEY = "orrak-analytics-v1";
const VISITOR_KEY = "orrak-visitor-id";
const SESSION_KEY = "orrak-session-id";
const SESSION_STARTED_KEY = "orrak-session-started";

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

function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;

    const visitorId = createId("visitor");
    window.localStorage.setItem(VISITOR_KEY, visitorId);
    return visitorId;
  } catch {
    return "visitor_unknown";
  }
}

function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const sessionId = createId("session");
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    return "session_unknown";
  }
}

export function trackEvent(name, meta = {}) {
  if (typeof window === "undefined") return;

  const analytics = loadAnalytics();
  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  analytics.events.unshift({
    name,
    meta: {
      ...meta,
      visitorId,
      sessionId,
    },
    at: new Date().toISOString(),
  });
  analytics.events = analytics.events.slice(0, 300);
  saveAnalytics(analytics);
}

export function trackAppOpen(meta = {}) {
  if (typeof window === "undefined") return;

  const sessionId = getSessionId();
  if (window.sessionStorage.getItem(SESSION_STARTED_KEY) === sessionId) {
    return;
  }

  window.sessionStorage.setItem(SESSION_STARTED_KEY, sessionId);
  trackEvent("app_open", {
    ...meta,
    date: new Date().toISOString().slice(0, 10),
  });
}

export function getAnalyticsSummary() {
  if (typeof window === "undefined") {
    return {
      totalEvents: 0,
      appOpens: 0,
      uniqueVisitors: 0,
      uniqueSessions: 0,
      latestEventAt: null,
    };
  }

  const events = loadAnalytics().events || [];
  const uniqueVisitors = new Set(events.map((event) => event.meta?.visitorId).filter(Boolean));
  const uniqueSessions = new Set(events.map((event) => event.meta?.sessionId).filter(Boolean));

  return {
    totalEvents: events.length,
    appOpens: events.filter((event) => event.name === "app_open").length,
    screenViews: events.filter((event) => event.name === "screen_view").length,
    uniqueVisitors: uniqueVisitors.size,
    uniqueSessions: uniqueSessions.size,
    latestEventAt: events[0]?.at || null,
  };
}
