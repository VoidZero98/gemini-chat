import { Button, Input } from "antd";
import styles from "./ChatInputBar.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  onSend: () => void;
};

const PaperPlaneIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="currentColor"
    style={{ display: "block" }}
  >
    <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

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
          autoSize={{ minRows: 3, maxRows: 12 }}
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
            icon={!loading ? <PaperPlaneIcon /> : undefined}
            className={`${styles.sendBtnBase} ${primaryLook ? styles.sendBtn : ""}`}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};
