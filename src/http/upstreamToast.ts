import { HttpError } from "./httpError";

/**
 * 需额外 `message.warning` 的上游 HTTP 状态（与后端 `UPSTREAM_ERROR_MAP` 等对齐）。
 * 新增同类状态码时只改此表。
 */
export const UPSTREAM_TOAST_HTTP_STATUS_MAP = {
  /** Gemini 限流 / 配额，body.code: RATE_LIMIT */
  429: "RATE_LIMIT",
  /** 模型高负载，body.code: MODEL_OVERLOADED */
  503: "MODEL_OVERLOADED",
} as const satisfies Record<number, string>;

const toastStatuses = new Set<number>(
  Object.keys(UPSTREAM_TOAST_HTTP_STATUS_MAP).map(Number),
);

export const isUpstreamToastError = (e: unknown): e is HttpError =>
  e instanceof HttpError && toastStatuses.has(e.status);
