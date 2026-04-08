import { Button, Flex, Input } from "antd";
import styles from "./ChatInputBar.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  onSend: () => void;
};

export const ChatInputBar = ({
  value,
  onChange,
  loading,
  onSend,
}: Props) => (
  <Flex gap="small" className={styles.wrap}>
    <Input.TextArea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="输入消息，Enter 发送，Shift+Enter 换行"
      autoSize={{ minRows: 2, maxRows: 6 }}
      onPressEnter={(e) => {
        if (!e.shiftKey) {
          e.preventDefault();
          void onSend();
        }
      }}
      disabled={loading}
    />
    <Button
      type="primary"
      onClick={() => void onSend()}
      loading={loading}
      disabled={!value.trim()}
      className={styles.sendBtn}
    >
      发送
    </Button>
  </Flex>
);
