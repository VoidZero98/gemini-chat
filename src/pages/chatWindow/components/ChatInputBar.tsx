import { Button, Input } from "antd";
import styles from "./ChatInputBar.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  onSend: () => void;
};

export const ChatInputBar = ({ value, onChange, loading, onSend }: Props) => {
  const hasText = Boolean(value.trim());
  const primaryLook = hasText || loading;
  return (
    <div className={styles.wrap}>
      <div className={styles.composer}>
        <Input.TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入消息…"
          variant="borderless"
          autoSize={{ minRows: 4, maxRows: 12 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          disabled={loading}
          className={styles.textarea}
        />
        <div className={styles.toolbar}>
          <span className={styles.shortcutHint}>
            Enter 发送 · Shift+Enter 换行
          </span>
          <Button
            type={primaryLook ? "primary" : "default"}
            onClick={() => void onSend()}
            loading={loading}
            disabled={loading || !hasText}
            className={`${styles.sendBtnBase} ${primaryLook ? styles.sendBtn : ""}`}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};
