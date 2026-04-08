import { GEMINI_MODEL as FALLBACK_MODEL } from "./ai.config.example";

const locals = import.meta.glob<{
  GEMINI_MODEL: typeof FALLBACK_MODEL;
  GEMINI_API_KEY: string;
}>("./ai.config.local.ts", { eager: true });

const mod = Object.values(locals)[0];

export const GEMINI_MODEL = mod?.GEMINI_MODEL ?? FALLBACK_MODEL;
export const GEMINI_API_KEY = mod?.GEMINI_API_KEY?.trim() ?? "";
