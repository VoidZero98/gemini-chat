export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

export type SendChatPayload = {
  sessionId?: number
  title: string
  messages: ChatMessage[]
}

export type SendChatResult = {
  sessionId: number
  title: string
  answer: string
}

export type ChatSessionSummary = {
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

export type ChatHistoryMessage = {
  id: number
  role: ChatRole
  content: string
  createdAt: string
}

export type ChatSessionDetail = {
  id: number
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatHistoryMessage[]
}
