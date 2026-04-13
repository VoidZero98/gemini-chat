const TOAST_STATUSES = new Set([429, 502, 503, 504]);

/** 从 SDK/网关返回的 JSON 字符串（可能多层嵌套）里取 HTTP 业务码 */
const getStatusFromJsonString = (raw: string): number | undefined => {
  let s = raw.trim();
  for (let depth = 0; depth < 4; depth++) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (!parsed || typeof parsed !== "object") return undefined;
      const p = parsed as Record<string, unknown>;
      const err = p.error;
      if (err && typeof err === "object") {
        const code = (err as { code?: unknown }).code;
        if (typeof code === "number" && code >= 400) return code;
        const inner = (err as { message?: unknown }).message;
        if (typeof inner === "string" && inner.trim()) {
          s = inner.trim();
          continue;
        }
      }
      const code = p.code;
      if (typeof code === "number" && code >= 400) return code;
      return undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

/** 供 API 层判断是否需要换模型重试 */
export const getHttpStatus = (e: unknown): number | undefined => {
  if (e instanceof Error && e.message.trim()) {
    const fromMsg = getStatusFromJsonString(e.message);
    if (fromMsg !== undefined) return fromMsg;
  }
  if (!e || typeof e !== "object") return undefined;
  const o = e as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.trim()) {
    const fromMsg = getStatusFromJsonString(o.message);
    if (fromMsg !== undefined) return fromMsg;
  }
  if (typeof o.status === "number" && o.status >= 400) return o.status;
  if (typeof o.status === "string") {
    const n = Number(o.status);
    if (!Number.isNaN(n) && n >= 400) return n;
  }
  const nested = o.error;
  if (nested && typeof nested === "object") {
    const code = (nested as { code?: unknown }).code;
    if (typeof code === "number" && code >= 400) return code;
  }
  const cause = o.cause;
  if (cause) return getHttpStatus(cause);
  return undefined;
};

export const getUpstreamToastMessage = (e: unknown): string | undefined => {
  const status = getHttpStatus(e);
  if (!status || !TOAST_STATUSES.has(status)) return undefined;
  // 对上游常见失败状态给出友好提示。
  if (status === 429) {
    return "今日额度已用完，请明天再试；也可在 Google AI Studio 查看或提升配额。";
  }
  if (status === 502) {
    return "模型服务暂时不可用，请稍后重试。";
  }
  if (status === 503) {
    return "此型号目前需求量较大。需求高峰通常是暂时的。请稍后再试。";
  }
  if (status === 504) {
    return "模型响应超时，请稍后重试或精简问题后再试。";
  }
  return undefined;
};
