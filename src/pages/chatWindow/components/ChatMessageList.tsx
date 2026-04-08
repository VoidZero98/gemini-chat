import { forwardRef } from "react";
import type { Ref } from "react";
import { Empty, Flex } from "antd";
import type { ChatMessage } from "@/api/chat";
import { ChatMessageRow } from "./ChatMessageRow";
import styles from "./ChatMessageList.module.css";

const EMPTY_TEXT = "在下方输入内容，发送后即可开始对话";

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  listEndRef: Ref<HTMLDivElement | null>;
};

export const ChatMessageList = forwardRef<HTMLDivElement, Props>(
  function ChatMessageList({ messages, loading, listEndRef }, ref) {
    return (
      <div ref={ref} className={styles.messageList}>
        <Flex vertical gap="middle" className={styles.messageListInner}>
          {messages.length === 0 ? (
            <Empty description={EMPTY_TEXT} className={styles.emptyCenter} />
          ) : (
            messages.map((m) => (
              <ChatMessageRow
                key={m.id}
                message={m}
                assistantPending={
                  m.role === "assistant" && loading && m.content === ""
                }
              />
            ))
          )}
          <div ref={listEndRef} />
        </Flex>
      </div>
    );
  },
);
