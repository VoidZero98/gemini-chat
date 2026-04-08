import { GEMINI_MODEL as FALLBACK_MODEL } from "./ai.config.example";

type ModelList = readonly string[] | string[];

const locals = import.meta.glob<{
  GEMINI_MODEL: string | ModelList;
  GEMINI_API_KEY: string;
}>("./ai.config.local.ts", { eager: true });

const mod = Object.values(locals)[0];

const normalizeModels = (m: string | ModelList): readonly string[] =>
  typeof m === "string" ? [m] : [...m];

export const GEMINI_MODEL: readonly string[] = normalizeModels(
  mod?.GEMINI_MODEL ?? FALLBACK_MODEL,
);

export const GEMINI_API_KEY = mod?.GEMINI_API_KEY?.trim() ?? "";
