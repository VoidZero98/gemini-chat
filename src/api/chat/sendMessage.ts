import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, GEMINI_MODEL } from "@/config/ai.config";
import { getHttpStatus } from "./upstreamToast";
import type { ChatMessage } from "./types";

/**
 * 是否改用列表中的下一个模型。
 * - 换模型：429、404（模型不存在/当前 API 不支持）、非 503 的 5xx、无 HTTP 状态（多为网络）
 * - 不换：503（同型号过载，换模型通常无意义）、其它 4xx（多为参数/权限问题）
 */
const shouldTryNextModel = (e: unknown): boolean => {
  const status = getHttpStatus(e);
  if (status === 429) return true;
  if (status === 404) return true;
  if (status === 503) return false;
  if (status !== undefined && status >= 500) return true;
  if (status !== undefined && status >= 400 && status < 500) return false;
  return true;
};

let client: GoogleGenAI | null = null;
let preferredModelIndex = 0;

const getModelAttemptOrder = (
  models: readonly string[],
  preferredIndex: number,
): number[] => {
  if (models.length === 0) return [];
  const start = ((preferredIndex % models.length) + models.length) % models.length;
  return Array.from({ length: models.length }, (_, offset) => {
    return (start + offset) % models.length;
  });
};

const getGenAI = (): GoogleGenAI => {
  if (!client) {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey?.trim()) {
      throw new Error(
        "请复制 src/config/ai.config.example.ts 为 ai.config.local.ts 并填写 GEMINI_API_KEY",
      );
    }
    client = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return client;
};

/** Gemini API 中助手角色为 `model`，与本地 `assistant` 对应 */
const chatMessagesToGeminiContents = (
  messages: ChatMessage[],
): { role: string; parts: { text: string }[] }[] => {
  const out: { role: string; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    const t = m.content.trim();
    if (!t) continue;
    out.push({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: t }],
    });
  }
  if (out.length === 0) {
    throw new Error("无有效对话内容");
  }
  return out;
};

/**
 * 流式生成；`history` 为截至当前用户消息为止的完整轮次（含本轮用户），供多轮上下文。
 */
export const sendChatMessage = async (
  history: ChatMessage[],
  onChunk: (piece: string) => void,
): Promise<void> => {
  const ai = getGenAI();
  const contents = chatMessagesToGeminiContents(history);
  const models = GEMINI_MODEL;
  if (models.length === 0) {
    throw new Error("GEMINI_MODEL 不能为空");
  }
  const attemptOrder = getModelAttemptOrder(models, preferredModelIndex);
  let lastErr: unknown;
  for (let attempt = 0; attempt < attemptOrder.length; attempt++) {
    const modelIndex = attemptOrder[attempt];
    let emitted = false;
    try {
      const stream = await ai.models.generateContentStream({
        model: models[modelIndex],
        contents,
      });
      for await (const chunk of stream) {
        const piece = chunk.text;
        if (piece) {
          emitted = true;
          onChunk(piece);
        }
      }
      preferredModelIndex = modelIndex;
      return;
    } catch (e) {
      lastErr = e;
      if (emitted) throw e;
      if (attempt < attemptOrder.length - 1 && shouldTryNextModel(e)) {
        preferredModelIndex = (modelIndex + 1) % models.length;
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
};

const TITLE_PROMPT_MAX_CHARS = 48;

/**
 * 根据首条用户消息生成简短会话标题（非流式一次调用）。
 */
export const generateChatTitle = async (
  userText: string,
): Promise<string> => {
  const trimmed = userText.trim();
  if (!trimmed) {
    throw new Error("empty user text");
  }
  const ai = getGenAI();
  const prompt = `你是对话标题助手。根据用户的第一条消息，生成一个简短、准确的中文标题。
要求：不超过 ${TITLE_PROMPT_MAX_CHARS} 个字符；不要引号或书名号；不要“关于”“讨论”等套话；只输出标题本身，不要换行或任何解释。

用户消息：
${trimmed}`;
  const models = GEMINI_MODEL;
  if (models.length === 0) {
    throw new Error("GEMINI_MODEL 不能为空");
  }
  const attemptOrder = getModelAttemptOrder(models, preferredModelIndex);
  let res: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>;
  for (let attempt = 0; attempt < attemptOrder.length; attempt++) {
    const modelIndex = attemptOrder[attempt];
    try {
      res = await ai.models.generateContent({
        model: models[modelIndex],
        contents: prompt,
        config: {
          maxOutputTokens: 128,
          temperature: 0.3,
        },
      });
      preferredModelIndex = modelIndex;
      break;
    } catch (e) {
      if (attempt < attemptOrder.length - 1 && shouldTryNextModel(e)) {
        preferredModelIndex = (modelIndex + 1) % models.length;
        continue;
      }
      throw e;
    }
  }
  const raw = res!.text?.trim() ?? "";
  let t = raw.replace(/\s+/g, " ").replace(/^["「『]|["」』]$/g, "").trim();
  if (t.length > TITLE_PROMPT_MAX_CHARS) {
    t = `${t.slice(0, TITLE_PROMPT_MAX_CHARS)}…`;
  }
  if (!t) {
    throw new Error("empty title from model");
  }
  return t;
};
