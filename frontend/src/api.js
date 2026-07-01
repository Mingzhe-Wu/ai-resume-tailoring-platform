import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE = "Network error. Please check your connection.";

function isTechnicalMessage(message) {
  return (
    /\b[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*){2,}\b/.test(message) ||
    /\b(Exception|StackTrace|SQLException|NullPointerException|RuntimeException)\b/.test(message) ||
    /\bat\s+[\w.$]+\(.*:\d+\)/.test(message)
  );
}

function safeMessage(message, fallback) {
  if (typeof message !== "string" || !message.trim()) {
    return fallback;
  }

  const trimmed = message.trim();
  return isTechnicalMessage(trimmed) ? fallback : trimmed;
}

export function getApiErrorMessage(error, fallback = DEFAULT_ERROR_MESSAGE) {
  const data = error?.response?.data;
  const fallbackMessage = fallback || DEFAULT_ERROR_MESSAGE;

  if (typeof data === "string" && data.trim()) {
    return safeMessage(data, fallbackMessage);
  }

  if (data && typeof data === "object") {
    const message = data.message || data.errorMessage || data.error || data.detail;
    if (typeof message === "string" && message.trim()) {
      return safeMessage(message, fallbackMessage);
    }
  }

  if (!error?.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  return fallbackMessage;
}

export function getEffectivePromptTemplate(type) {
  return api.get("/api/prompt-templates/effective", {
    params: { type },
  });
}

export function savePromptTemplate(type, content) {
  return api.put(
    "/api/prompt-templates",
    { content },
    {
      params: { type },
    }
  );
}

export function resetPromptTemplate(type) {
  return api.delete("/api/prompt-templates", {
    params: { type },
  });
}

export function getSkillKeywords() {
  return api.get("/api/skill-keywords");
}

export function getTodayAiQuota(userId) {
  return api.get(`/api/redis/quota/today?userId=${encodeURIComponent(userId)}`);
}

export default api;
