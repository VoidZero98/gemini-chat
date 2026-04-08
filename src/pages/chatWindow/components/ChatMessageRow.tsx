import { AssistantMarkdown } from "./AssistantMarkdown";
import { Avatar, Card, Flex, Spin, Typography } from "antd";
import type { ChatMessage } from "@/api/chat";
import styles from "./ChatMessageRow.module.css";

const { Text, Paragraph } = Typography;

type Props = {
  message: ChatMessage;
  /** 当前轮次助手是否仍在等待首包 */
  assistantPending: boolean;
};

export const ChatMessageRow = ({ message, assistantPending }: Props) => {
  const isUser = message.role === "user";

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
      <Flex
        vertical
        className={styles.bubbleColumn}
      >
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
        <Text
          type="secondary"
          className={`${styles.roleHint} ${isUser ? styles.roleHintUser : styles.roleHintAssistant}`}
        >
          {isUser ? "我" : "助手"}
        </Text>
      </Flex>
      {isUser && <Avatar className={styles.avatarUser}>我</Avatar>}
    </Flex>
  );
};
