import { useEffect, useRef, useState } from "react";
import { nextId } from "@/utils/id";
import {
  getChatSessionDetail,
  sendChatMessageStream,
  listChatSessions,
  deleteChatSession,
  generateChatTitle,
  getUpstreamToastMessage,
} from "@/api/chat";
import { AuthApi } from "@/api";
import { useStickToBottom } from "@/hooks/useStickToBottom";
import { ChatInputBar } from "./components/ChatInputBar";
import { ChatMessageList } from "./components/ChatMessageList";
import SimpleBar from "simplebar-react";
import { DeleteOutlined } from "@ant-design/icons";
import {
  App as AntApp,
  Avatar,
  Button,
  Empty,
  Flex,
  FloatButton,
  Layout,
  Spin,
  Typography,
} from "antd";
import { useNavigate } from "react-router-dom";
import { tokenStore } from "@/api";
import {
  clearCachedProfile,
  getCachedProfile,
  subscribeProfileChanges,
} from "@/api/auth/profileStore";
import styles from "./styles.module.css";
import type { ChatMessage, ChatSessionSummary } from "@/api/chat";
import type { AuthUser } from "@/api/auth";

const DEFAULT_CARD_TITLE = "Gemini Chat";
const DEFAULT_ERROR_MESSAGE = "请求失败，请稍后重试";
const FALLBACK_SESSION_ERROR_MESSAGE = "加载历史会话失败";

const getErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
): string => (error instanceof Error ? error.message : fallbackMessage);

const formatSessionTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ChatWindow = () => {
  const { message, modal } = AntApp.useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionListLoading, setSessionListLoading] = useState(false);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  /** 由模型总结的首条标题；清空会话时重置 */
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const titleGenSeqRef = useRef(0);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const { pinToBottom } = useStickToBottom(listScrollRef, messages);

  const cardTitle = sessionTitle ?? DEFAULT_CARD_TITLE;
  const activeSessionId = sessionId;
  const currentSessionHint = activeSessionId ? "历史对话" : "新对话";

  const resetCurrentSession = (): void => {
    titleGenSeqRef.current += 1;
    setSessionId(undefined);
    setSessionTitle(null);
    setMessages([]);
  };

  const loadSessions = async (): Promise<void> => {
    try {
      setSessionListLoading(true);
      const data = await listChatSessions();
      setSessions(data);
    } catch (error) {
      message.warning(getErrorMessage(error, FALLBACK_SESSION_ERROR_MESSAGE));
    } finally {
      setSessionListLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    const cached = getCachedProfile();
    if (cached) {
      setCurrentUser(cached);
    }

    const loadCurrentUser = async (): Promise<void> => {
      try {
        const user = await AuthApi.getProfile();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    };
    void loadCurrentUser();

    return subscribeProfileChanges((profile) => {
      setCurrentUser(profile);
    });
  }, []);

  const handleClear = () => {
    if (loading) return;
    resetCurrentSession();
  };

  const handleLogout = () => {
    modal.confirm({
      title: "确认退出登录？",
      content: "退出后需要重新输入账号和密码登录。",
      okText: "退出登录",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: () => {
        tokenStore.clear();
        clearCachedProfile();
        navigate("/login", { replace: true });
      },
    });
  };

  const handleGoProfile = () => {
    navigate("/profile");
  };

  const handleSelectSession = async (targetSessionId: number): Promise<void> => {
    if (loading || sessionDetailLoading) return;
    try {
      setSessionDetailLoading(true);
      const detail = await getChatSessionDetail(targetSessionId);
      resetCurrentSession();
      setSessionId(detail.id);
      setSessionTitle(detail.title);
      setMessages(
        detail.messages.map((item) => ({
          id: `history-${item.id}`,
          role: item.role,
          content: item.content,
        })),
      );
    } catch (error) {
      message.warning(getErrorMessage(error, "加载会话详情失败"));
    } finally {
      setSessionDetailLoading(false);
    }
  };

  const handleDeleteSession = (targetSessionId: number): void => {
    if (loading || sessionDetailLoading) return;
    const target = sessions.find((item) => item.id === targetSessionId);
    modal.confirm({
      title: "确认删除该历史会话？",
      content: `删除后不可恢复：${target?.title ?? "未命名会话"}`,
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          setDeletingSessionId(targetSessionId);
          await deleteChatSession(targetSessionId);
          setSessions((prev) => prev.filter((item) => item.id !== targetSessionId));
          if (sessionId === targetSessionId) {
            resetCurrentSession();
          }
          message.success("历史会话已删除");
        } catch (error) {
          message.warning(getErrorMessage(error, "删除历史会话失败"));
        } finally {
          setDeletingSessionId(null);
        }
      },
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const isFirstUserInSession = !messages.some(
      (m) => m.role === "user" && m.content.trim(),
    );
    let effectiveTitle = cardTitle;
    if (isFirstUserInSession) {
      const seq = ++titleGenSeqRef.current;
      try {
        const generatedTitle = await generateChatTitle(text);
        if (seq === titleGenSeqRef.current) {
          setSessionTitle(generatedTitle);
        }
        effectiveTitle = generatedTitle;
      } catch (error) {
        message.warning(getErrorMessage(error, "生成标题失败，请稍后重试"));
        return;
      }
    }

    pinToBottom();

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
    };
    const historyForRequest = [...messages, userMsg];

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      let streamResultSessionId: number | undefined;
      const result = await sendChatMessageStream(
        {
          sessionId,
          title: effectiveTitle,
          messages: historyForRequest,
        },
        (piece) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + piece } : m,
            ),
          );
        },
      );
      streamResultSessionId = result.sessionId;
      if (streamResultSessionId) {
        setSessionId(streamResultSessionId);
      }
      void loadSessions();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: result.answer } : m,
        ),
      );
    } catch (e) {
      const toastMsg = getUpstreamToastMessage(e);
      if (toastMsg) message.warning(toastMsg);
      const err = e instanceof Error ? e.message : String(e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `请求失败：${err}` } : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const sessionListNode = (() => {
    if (sessionListLoading) {
      return (
        <div className={styles.sidebarState}>
          <Spin size="small" />
        </div>
      );
    }
    if (sessions.length === 0) {
      return (
        <div className={styles.sidebarState}>
          <Empty description="暂无历史会话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }
    return (
      <SimpleBar className={styles.sidebarList} autoHide forceVisible={false}>
        {sessions.map((item) => {
          const active = activeSessionId === item.id;
          const deleting = deletingSessionId === item.id;
          return (
            <div
              key={item.id}
              className={`${styles.sidebarItem} ${active ? styles.sidebarItemActive : ""}`}
              onClick={() => void handleSelectSession(item.id)}
            >
              <div className={styles.sidebarItemTop}>
                <div className={styles.sidebarTitle}>{item.title}</div>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  className={styles.sidebarDeleteButton}
                  loading={deleting}
                  disabled={loading || sessionDetailLoading}
                  aria-label="删除历史会话"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteSession(item.id);
                  }}
                />
              </div>
              <div className={styles.sidebarTime}>
                {formatSessionTime(item.updatedAt)}
              </div>
            </div>
          );
        })}
      </SimpleBar>
    );
  })();

  return (
    <Layout className={styles.layoutRoot}>
      <Layout className={styles.mainLayout}>
        <Layout.Sider width={300} className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div>
              <Typography.Title level={4} className={styles.brandTitle}>
                Gemini Chat
              </Typography.Title>
              <div className={styles.brandSubTitle}>你的智能对话助手</div>
            </div>
            <button
              type="button"
              className={styles.userProfileCard}
              onClick={handleGoProfile}
              aria-label="打开个人资料"
            >
              <Avatar
                size={36}
                className={styles.userProfileAvatar}
                src={currentUser?.avatar}
              >
                {currentUser?.account?.slice(0, 1).toUpperCase() ?? "我"}
              </Avatar>
              <div className={styles.userProfileMeta}>
                <div className={styles.userProfileName}>
                  {currentUser?.account ?? "当前用户"}
                </div>
                <div className={styles.userProfileBio}>
                  {currentUser?.bio?.trim() || "欢迎回来，开始新的对话吧"}
                </div>
              </div>
            </button>
            <Flex gap={8} className={styles.sidebarActions}>
              <Button
                type="primary"
                onClick={handleClear}
                disabled={loading}
                className={styles.newSessionBtn}
              >
                新建会话
              </Button>
              <Button danger onClick={handleLogout} className={styles.logoutBtn}>
                退出登录
              </Button>
            </Flex>
          </div>
          <div className={styles.sidebarHeader}>历史记录</div>
          <div className={styles.sidebarScrollHost}>{sessionListNode}</div>
        </Layout.Sider>
        <Layout.Content className={styles.content}>
          <section className={styles.chatPanel}>
            <div className={styles.chatPanelHeader}>
              <div className={styles.chatTitle}>{cardTitle}</div>
              <div className={styles.chatHint}>{currentSessionHint}</div>
            </div>
            <div className={styles.scrollWrap}>
              <ChatMessageList
                ref={listScrollRef}
                messages={messages}
                loading={loading}
                userAvatarUrl={currentUser?.avatar}
              />
              <FloatButton.BackTop
                className={styles.backTop}
                target={() => listScrollRef.current ?? window}
                visibilityHeight={160}
                duration={350}
                tooltip="回到顶部"
                type="primary"
                shape="circle"
              />
            </div>
            <ChatInputBar
              value={input}
              onChange={setInput}
              loading={loading || sessionDetailLoading}
              onSend={handleSend}
            />
          </section>
          {sessionDetailLoading ? (
            <div className={styles.contentMask}>
              <Spin />
            </div>
          ) : null}
        </Layout.Content>
      </Layout>
    </Layout>
  );
};
