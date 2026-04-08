import { useCallback, useEffect, useRef, useState } from "react";
import { AssistantMarkdown } from "./AssistantMarkdown";
import {
  Avatar,
  Button,
  Card,
  Flex,
  Spin,
  Tooltip,
  Typography,
  message as antdMessage,
} from "antd";
import type { ChatMessage } from "@/api/chat";
import styles from "./ChatMessageRow.module.css";

const { Text, Paragraph } = Typography;

/** 与常见网页聊天复制图标一致的描边风格，避免额外依赖 */
function IconCopy() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

type Props = {
  message: ChatMessage;
  /** 当前轮次助手是否仍在等待首包 */
  assistantPending: boolean;
};

export const ChatMessageRow = ({ message, assistantPending }: Props) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleCopyUserMessage = useCallback(async () => {
    const text = message.content;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
      antdMessage.success("已复制");
    } catch {
      antdMessage.error("复制失败，请检查浏览器权限");
    }
  }, [message.content]);

  const canCopyUser = isUser && Boolean(message.content.trim());

  return (
    <Flex
      gap="small"
      align="flex-start"
      justify={isUser ? "flex-end" : "flex-start"}
      className={styles.row}
    >
      {message.role === "assistant" && (
        <Avatar className={styles.avatarAi}>AI</Avatar>
      )}
      <Flex vertical className={styles.bubbleColumn}>
        <Card
          size="small"
          className={`${styles.bubbleCard} ${isUser ? styles.bubbleCardUser : styles.bubbleCardAssistant}`}
        >
          {message.role === "assistant" && assistantPending ? (
            <Spin size="small" />
          ) : message.role === "assistant" ? (
            <AssistantMarkdown content={message.content} />
          ) : (
            <Paragraph className={styles.userParagraph}>
              {message.content}
            </Paragraph>
          )}
        </Card>
        {isUser ? (
          <Flex
            align="center"
            justify="flex-end"
            gap={6}
            className={styles.userFooter}
          >
            {canCopyUser && (
              <Tooltip title={copied ? "已复制" : "复制"}>
                <Button
                  type="text"
                  size="small"
                  className={styles.copyBtn}
                  icon={copied ? <IconCheck /> : <IconCopy />}
                  aria-label={copied ? "已复制" : "复制问题"}
                  onClick={() => void handleCopyUserMessage()}
                />
              </Tooltip>
            )}
            <Text
              type="secondary"
              className={`${styles.roleHint} ${styles.roleHintUser}`}
            >
              我
            </Text>
          </Flex>
        ) : (
          <Text
            type="secondary"
            className={`${styles.roleHint} ${styles.roleHintAssistant}`}
          >
            助手
          </Text>
        )}
      </Flex>
      {isUser && <Avatar className={styles.avatarUser}>我</Avatar>}
    </Flex>
  );
};
