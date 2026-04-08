/**
 * 复制本文件为同目录下的 ai.config.local.ts，填写密钥后即可使用（ai.config.local.ts 已在 .gitignore，勿提交）。
 * 按优先级排列；前一个请求失败（含网络）或 429 时会自动尝试下一个。
 */
export const GEMINI_MODEL = [
  "gemini-3-pro",
  "gemini-2.5-flash-lite",
] as const;

export const GEMINI_API_KEY = "";
