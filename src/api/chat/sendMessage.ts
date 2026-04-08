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
