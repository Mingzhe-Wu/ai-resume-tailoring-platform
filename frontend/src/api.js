import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiErrorMessage(error, fallback = "Request failed") {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const message = data.message || data.error || data.detail;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error?.message && !error.response) {
    return error.message;
  }

  return fallback;
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

export default api;
