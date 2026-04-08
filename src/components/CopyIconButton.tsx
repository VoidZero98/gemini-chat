import { Button, Tooltip } from "antd";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { IconCheck, IconCopy } from "@/components/icons/CopyIcons";

type Props = {
  text: string;
  className?: string;
  /** 无文案时不展示按钮 */
  disabled?: boolean;
};

/**
 * 通用：图标按钮复制一段文本（流式过程中也可点，复制当前已生成内容）。
 */
export const CopyIconButton = ({ text, className, disabled }: Props) => {
  const { copied, copy } = useCopyToClipboard();
  const canCopy = Boolean(text.trim()) && !disabled;

  if (!canCopy) return null;

  return (
    <Tooltip title={copied ? "已复制" : "复制"}>
      <Button
        type="text"
        size="small"
        className={className}
        icon={copied ? <IconCheck /> : <IconCopy />}
        aria-label={copied ? "已复制" : "复制"}
        onClick={() => void copy(text)}
      />
    </Tooltip>
  );
};
