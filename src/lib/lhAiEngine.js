import { LocalAI } from "./localAi";

function findBrowserEngine() {
  if (typeof window === "undefined") return null;
  return window.logicHubAIEngine || window.LogicHubAIEngine || window.LHAI || null;
}

function readEnv(name) {
  if (typeof window === "undefined") return "";
  return window.__ORRAK_ENV__?.[name] || "";
}

function getEndpointConfig() {
  const endpoint = readEnv("VITE_LH_AI_ENDPOINT");
  const apiKey = readEnv("VITE_LH_AI_API_KEY");
  if (!endpoint) return null;
  return { endpoint, apiKey };
}

function buildEnvelope(method, payload) {
  return {
    appId: "orrak",
    appVersion: "0.2.0",
    locale: "ko-KR",
    method,
    input: payload,
  };
}

async function callBrowserEngine(method, payload) {
  const engine = findBrowserEngine();
  if (!engine) {
    throw new Error("LH-AI browser engine not found");
  }

  if (typeof engine.run === "function") {
    return engine.run(method, buildEnvelope(method, payload));
  }

  if (typeof engine[method] === "function") {
    return engine[method](buildEnvelope(method, payload));
  }

  throw new Error(`LH-AI method "${method}" is unavailable`);
}

async function callEndpointEngine(method, payload) {
  const config = getEndpointConfig();
  if (!config) {
    throw new Error("LH-AI endpoint not configured");
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify(buildEnvelope(method, payload)),
  });

  if (!response.ok) {
    throw new Error(`LH-AI endpoint error: ${response.status}`);
  }

  return response.json();
}

export function createLhAiEngine() {
  async function withFallback(method, payload, localHandler) {
    try {
      const result = findBrowserEngine()
        ? await callBrowserEngine(method, payload)
        : await callEndpointEngine(method, payload);

      if (typeof result === "string") return result;
      return result?.text || result?.message || result?.output || (await localHandler());
    } catch {
      return localHandler();
    }
  }

  const providerLabel = findBrowserEngine()
    ? "LH-AI Bridge"
    : getEndpointConfig()
      ? "LH-AI API"
      : "Local Fallback";

  return {
    providerLabel,
    async getTip() {
      return withFallback("getTip", {}, () => LocalAI.getTip());
    },
    async getBooster(mood) {
      return withFallback("getBooster", { mood }, () => LocalAI.getBooster(mood));
    },
    async getSchedule(tasks, gradeLabel) {
      return withFallback("getSchedule", { tasks, gradeLabel }, () =>
        LocalAI.getSchedule(tasks, gradeLabel)
      );
    },
    async getSolution(distraction) {
      return withFallback("getSolution", { distraction }, () =>
        LocalAI.getSolution(distraction)
      );
    },
    async getKickstart(task) {
      return withFallback("getKickstart", { task }, () => LocalAI.getKickstart(task));
    },
    async getPersona(score, falls, context) {
      return withFallback("getPersona", { score, falls, context }, () =>
        LocalAI.getPersona(score, falls, context)
      );
    },
    async getRest(score, falls, context) {
      return withFallback("getRest", { score, falls, context }, () =>
        LocalAI.getRest(score, falls, context)
      );
    },
    async getRetro(reflection, score, context) {
      return withFallback("getRetro", { reflection, score, context }, () =>
        LocalAI.getRetro(reflection, score, context)
      );
    },
    async getWeeklyReport(records, context) {
      return withFallback("getWeeklyReport", { records, context }, () =>
        LocalAI.getWeeklyReport(records, context)
      );
    },
  };
}
