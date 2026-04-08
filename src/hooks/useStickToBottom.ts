import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

const NEAR_BOTTOM_PX = 80;

/**
 * 聊天区滚动：仅在用户「贴底」时随内容增高而下移；用户上滑阅读时不再强行拉到底。
 * 发送新消息前调用 `pinToBottom()` 表示本轮要跟到底。
 *
 * 注意：必须在同一帧 layout 后立刻 `scrollTop = scrollHeight`（不要用双 rAF），否则流式会晚两帧才跟底，看起来一蹦一蹦。
 * 程序性滚动触发的 `scroll` 事件需忽略，避免误判 `stickRef`。
 */
export const useStickToBottom = (
  scrollRef: RefObject<HTMLDivElement | null>,
  /** 任意会改变列表高度的依赖，例如 messages */
  scrollDeps: unknown,
) => {
  const stickRef = useRef(true);
  const ignoreProgrammaticScrollRef = useRef(false);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (ignoreProgrammaticScrollRef.current) return;
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickRef.current = gap < NEAR_BOTTOM_PX;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickRef.current) return;
    ignoreProgrammaticScrollRef.current = true;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => {
      ignoreProgrammaticScrollRef.current = false;
    });
  }, [scrollRef, scrollDeps]);

  const pinToBottom = useCallback(() => {
    stickRef.current = true;
  }, []);

  return { pinToBottom };
};
