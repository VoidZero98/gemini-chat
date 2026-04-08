import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, GEMINI_MODEL } from "@/config/ai.config";
import type { ChatMessage } from "./types";

let client: GoogleGenAI | null = null;

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

/**
 * 流式生成；历史暂不参与请求（与原先仅发单条 message 一致）。
 */
export const sendChatMessage = async (
  content: string,
  _history: ChatMessage[],
  onChunk: (piece: string) => void,
): Promise<void> => {
  void _history;
  const ai = getGenAI();
  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: content.trim(),
  });
  for await (const chunk of stream) {
    const piece = chunk.text;
    if (piece) onChunk(piece);
  }
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
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      maxOutputTokens: 128,
      temperature: 0.3,
    },
  });
  const raw = res.text?.trim() ?? "";
  let t = raw.replace(/\s+/g, " ").replace(/^["「『]|["」』]$/g, "").trim();
  if (t.length > TITLE_PROMPT_MAX_CHARS) {
    t = `${t.slice(0, TITLE_PROMPT_MAX_CHARS)}…`;
  }
  if (!t) {
    throw new Error("empty title from model");
  }
  return t;
};
