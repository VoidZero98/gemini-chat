const ACCESS_TOKEN_KEY = "gemini_access_token";

let memoryToken = "";

export const tokenStore = {
  get: (): string => {
    if (memoryToken) return memoryToken;
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
    memoryToken = stored;
    return memoryToken;
  },
  set: (token: string): void => {
    memoryToken = token.trim();
    if (memoryToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, memoryToken);
      return;
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
  clear: (): void => {
    memoryToken = "";
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
