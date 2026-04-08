const TOAST_STATUSES = new Set([429, 503]);

const getHttpStatus = (e: unknown): number | undefined => {
  if (!e || typeof e !== "object") return undefined;
  const o = e as Record<string, unknown>;
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
  if (e instanceof Error && e.message.trim()) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (status === 429)
    return "今日额度已用完，请明天再试；也可在 Google AI Studio 查看或提升配额。";
  if (status === 503)
    return "此型号目前需求量较大。需求高峰通常是暂时的。请稍后再试。";
  return undefined;
};
