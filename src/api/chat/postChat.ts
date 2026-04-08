import { request } from '../../http/request'

export type ChatPostBody = {
  message: string
}

export type ChatPostSuccess = {
  reply: string
}

/** POST /chat：向 Gemini 提问，返回模型文本 */
export const postChat = async (message: string): Promise<string> => {
  const data = await request<ChatPostSuccess>('/chat', {
    method: 'POST',
    body: { message } satisfies ChatPostBody,
  })
  return data.reply
}
