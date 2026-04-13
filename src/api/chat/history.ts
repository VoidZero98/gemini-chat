import { request } from "@/api/core";
import type { ChatSessionDetail, ChatSessionSummary } from "./types";

export const listChatSessions = async (): Promise<ChatSessionSummary[]> => {
  return request<ChatSessionSummary[]>("/chat/sessions", {
    method: "GET",
  });
};

export const getChatSessionDetail = async (
  sessionId: number,
): Promise<ChatSessionDetail> => {
  return request<ChatSessionDetail>(`/chat/sessions/${sessionId}/messages`, {
    method: "GET",
  });
};

export const deleteChatSession = async (
  sessionId: number,
): Promise<{ id: number }> => {
  return request<{ id: number }>(`/chat/sessions/${sessionId}`, {
    method: "DELETE",
  });
};
