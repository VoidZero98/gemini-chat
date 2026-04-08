import type { ChatMessage } from './types'
import { postChat } from './postChat'

/**
 * 页面侧发送：当前后端仅接收单条 message，历史由调用方自行扩展时再接入。
 */
export const sendChatMessage = async (
  content: string,
  _history: ChatMessage[],
): Promise<string> => {
  void _history
  return postChat(content.trim())
}
