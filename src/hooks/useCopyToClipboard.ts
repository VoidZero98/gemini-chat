import { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";
import { copyTextToClipboard } from "@/utils/clipboard";

type Options = {
  /** 「已复制」状态持续毫秒数 */
  copiedDurationMs?: number;
};

/**
 * 通用复制：成功 toast、失败 toast、短时的 copied 状态（用于图标切换）。
 */
export const useCopyToClipboard = (options: Options = {}) => {
  const { copiedDurationMs = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return false;
      try {
        await copyTextToClipboard(t);
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), copiedDurationMs);
        message.success("已复制");
        return true;
      } catch {
        message.error("复制失败，请检查浏览器权限");
        return false;
      }
    },
    [copiedDurationMs],
  );

  return { copied, copy };
};
