import { getApiBaseUrl } from "../config/api";
import { HttpError } from "./httpError";

export type RequestOptions = Omit<RequestInit, "body"> & {
  /** 对象会自动 JSON.stringify，并设置 application/json */
  body?: unknown;
};

const parseJsonSafe = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const pickErrorMessage = (res: Response, data: unknown): string => {
  if (data && typeof data === "object" && data !== null && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.length > 0) return err;
  }
  if (typeof data === "string" && data.length > 0) return data;
  return res.statusText || `HTTP ${res.status}`;
};

const resolveUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

/**
 * 全局 JSON 请求封装（fetch）。
 * - 成功：解析 JSON 为泛型 T
 * - 失败：解析 body 中的 `error` 字段（与文档一致），抛出 HttpError
 */
export const request = async <T = unknown>(
  path: string,
  init: RequestOptions = {},
): Promise<T> => {
  const url = resolveUrl(path);
  const { body: bodyInit, headers: headersInit, ...rest } = init;
  const headers = new Headers(headersInit);

  let body: BodyInit | undefined;
  if (bodyInit !== undefined) {
    if (
      bodyInit instanceof FormData ||
      bodyInit instanceof Blob ||
      bodyInit instanceof ArrayBuffer
    ) {
      body = bodyInit;
    } else if (typeof bodyInit === "string") {
      body = bodyInit;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json; charset=utf-8");
      }
      body = JSON.stringify(bodyInit);
    }
  }

  const res = await fetch(url, {
    ...rest,
    headers,
    body,
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new HttpError(pickErrorMessage(res, data), res.status, data);
  }

  return data as T;
};
