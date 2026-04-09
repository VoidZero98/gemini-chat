import { useRef, useState } from "react";
import { nextId } from "@/utils/id";
import {
  sendChatMessage,
  generateChatTitle,
  getUpstreamToastMessage,
} from "@/api/chat";
import { useStickToBottom } from "@/hooks/useStickToBottom";
import { ChatInputBar } from "./components/ChatInputBar";
import { ChatMessageList } from "./components/ChatMessageList";
import { Button, Card, Flex, FloatButton, message } from "antd";
import styles from "./styles.module.css";
import type { ChatMessage } from "@/api/chat";

const DEFAULT_CARD_TITLE = "Gemini Chat";

export const ChatWindow = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  /** 由模型总结的首条标题；清空会话时重置 */
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const titleGenSeqRef = useRef(0);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const { pinToBottom } = useStickToBottom(listScrollRef, messages);

  const cardTitle = sessionTitle ?? DEFAULT_CARD_TITLE;

  const handleClear = () => {
    if (loading) return;
    titleGenSeqRef.current += 1;
    setSessionTitle(null);
    setMessages([]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const isFirstUserInSession = !messages.some(
      (m) => m.role === "user" && m.content.trim(),
    );
    if (isFirstUserInSession) {
      const seq = ++titleGenSeqRef.current;
      void generateChatTitle(text)
        .then((t) => {
          if (seq !== titleGenSeqRef.current) return;
          setSessionTitle(t);
        })
        .catch(() => {});
    }

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
      await sendChatMessage(historyForRequest, (piece) => {
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
        title={cardTitle}
        extra={
          <Button
            color="primary"
            variant="outlined"
            onClick={handleClear}
            disabled={loading}
          >
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
            /* 覆盖 ant-card-bordered 的 colorBorderSecondary，避免左右像白缝 */
            borderColor: "rgba(251, 207, 232, 0.92)",
          },
          header: {
            background: "#fdf2f8",
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
