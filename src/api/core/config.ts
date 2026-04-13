const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.trim();

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeoutMs: 60000,
};
