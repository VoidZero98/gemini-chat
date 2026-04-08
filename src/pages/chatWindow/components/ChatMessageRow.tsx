import { Avatar, Card, Flex, Spin, Typography } from "antd";
import { CopyIconButton } from "@/components/CopyIconButton";
import { AssistantMarkdown } from "./AssistantMarkdown";
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
            <CopyIconButton text={message.content} className={styles.copyBtn} />
            <Text
              type="secondary"
              className={`${styles.roleHint} ${styles.roleHintUser} ${styles.roleLabelUser}`}
            >
              我
            </Text>
          </Flex>
        ) : (
          <Flex
            align="center"
            justify="flex-start"
            gap={6}
            className={styles.assistantFooter}
          >
            <CopyIconButton
              text={message.content}
              className={styles.copyBtnAssistant}
            />
            <Text
              type="secondary"
              className={`${styles.roleHint} ${styles.roleHintAssistant} ${styles.roleLabelAssistant}`}
            >
              助手
            </Text>
          </Flex>
        )}
      </Flex>
      {isUser && <Avatar className={styles.avatarUser}>我</Avatar>}
    </Flex>
  );
};
