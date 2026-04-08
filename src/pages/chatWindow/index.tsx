import { useRef, useState } from "react";
import { nextId } from "@/utils/id";
import { sendChatMessage, getUpstreamToastMessage } from "@/api/chat";
import { useStickToBottom } from "@/hooks/useStickToBottom";
import { ChatInputBar } from "./components/ChatInputBar";
import { ChatMessageList } from "./components/ChatMessageList";
import { Button, Card, Flex, FloatButton, message } from "antd";
import styles from "./styles.module.css";
import type { ChatMessage } from "@/api/chat";

export const ChatWindow = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const { pinToBottom } = useStickToBottom(listScrollRef, messages);

  const handleClear = () => {
    if (loading) return;
    setMessages([]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    pinToBottom();

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
    };
    const historyForRequest = [...messages, userMsg];

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      // 流式：与 generateContentStream 一致，按 chunk 追加到当前助手气泡
      await sendChatMessage(text, historyForRequest, (piece) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + piece } : m,
          ),
        );
      });
    } catch (e) {
      const toastMsg = getUpstreamToastMessage(e);
      if (toastMsg) message.warning(toastMsg);
      const err = e instanceof Error ? e.message : String(e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `请求失败：${err}` } : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex vertical className={styles.root}>
      <Card
        title="Gemini Chat"
        extra={
          <Button onClick={handleClear} disabled={loading}>
            清空
          </Button>
        }
        classNames={{
          root: styles.card,
          body: styles.cardBody,
        }}
        styles={{
          root: {
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          },
        }}
      >
        <div className={styles.scrollWrap}>
          <ChatMessageList
            ref={listScrollRef}
            messages={messages}
            loading={loading}
          />
          <FloatButton.BackTop
            className={styles.backTop}
            target={() => listScrollRef.current ?? window}
            visibilityHeight={160}
            duration={350}
            tooltip="回到顶部"
            type="primary"
            shape="circle"
          />
        </div>
        <ChatInputBar
          value={input}
          onChange={setInput}
          loading={loading}
          onSend={handleSend}
        />
      </Card>
    </Flex>
  );
};
