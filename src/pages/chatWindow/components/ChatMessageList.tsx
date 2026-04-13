import { forwardRef } from "react";
import { Empty, Flex } from "antd";
import SimpleBar from "simplebar-react";
import type { ChatMessage } from "@/api/chat";
import { ChatMessageRow } from "./ChatMessageRow";
import styles from "./ChatMessageList.module.css";

const EMPTY_TEXT = "在下方输入内容，发送后即可开始对话";

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  userAvatarUrl?: string;
};

export const ChatMessageList = forwardRef<HTMLDivElement, Props>(
  ({ messages, loading, userAvatarUrl }, ref) => (
    <SimpleBar
      className={styles.messageList}
      scrollableNodeProps={{ ref }}
      autoHide
      forceVisible={false}
    >
      <Flex vertical gap="middle" className={styles.messageListInner}>
        {messages.length === 0 ? (
          <Empty description={EMPTY_TEXT} className={styles.emptyCenter} />
        ) : (
          messages.map((m) => (
            <ChatMessageRow
              key={m.id}
              message={m}
              userAvatarUrl={userAvatarUrl}
              assistantPending={
                m.role === "assistant" && loading && m.content === ""
              }
            />
          ))
        )}
      </Flex>
    </SimpleBar>
  ),
);

ChatMessageList.displayName = "ChatMessageList";
