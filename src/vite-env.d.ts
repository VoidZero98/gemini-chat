/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 聊天 API Base，例如 http://127.0.0.1:3008（不要末尾 /） */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
