import { apiConfig, request, tokenStore } from "@/api/core";
import type { SendChatPayload, SendChatResult } from "./types";

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const emitPieceProgressively = async (
  piece: string,
  onChunk: (piece: string) => void,
): Promise<void> => {
  if (!piece) return;
  const step = piece.length > 24 ? 2 : 1;
  for (let index = 0; index < piece.length; index += step) {
    onChunk(piece.slice(index, index + step));
    await sleep(12);
  }
};

const parseSsePayload = (rawEvent: string): Record<string, unknown> | null => {
  const dataLine = rawEvent
    .split(/\r?\n/)
    .find((item) => item.startsWith("data: "));
  if (!dataLine) return null;
  return JSON.parse(dataLine.slice(6)) as Record<string, unknown>;
};

export const sendChatMessageStream = async (
  payload: SendChatPayload,
  onChunk: (piece: string) => void,
): Promise<SendChatResult> => {
  const token = tokenStore.get();
  const messages = payload.messages.map((item) => {
    return {
      role: item.role,
      content: item.content,
    };
  });
  const response = await fetch(new URL("/chat/send-stream", apiConfig.baseURL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      sessionId: payload.sessionId,
      title: payload.title,
      messages,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("流式请求失败");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let finalResult: SendChatResult | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";
    for (const rawEvent of events) {
      try {
        const data = parseSsePayload(rawEvent);
        if (!data) continue;
        if (data.type === "chunk" && typeof data.piece === "string") {
          await emitPieceProgressively(data.piece, onChunk);
          continue;
        }
        if (
          data.type === "done" &&
          typeof data.sessionId === "number" &&
          typeof data.title === "string" &&
          typeof data.answer === "string"
        ) {
          finalResult = {
            sessionId: data.sessionId,
            title: data.title,
            answer: data.answer,
          };
          continue;
        }
        if (data.type === "error" && typeof data.message === "string") {
          throw new Error(data.message);
        }
      } catch (error) {
        throw error instanceof Error ? error : new Error("流式数据解析失败");
      }
    }
  }
  if (!finalResult) {
    throw new Error("流式响应未完成");
  }
  return finalResult;
};

export const generateChatTitle = async (userText: string): Promise<string> => {
  const title = await request<string>("/chat/title", {
    method: "POST",
    body: { text: userText },
  });
  return title;
};
