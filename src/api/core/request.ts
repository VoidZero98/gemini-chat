import { apiConfig } from "./config";
import { ApiClientError } from "./error";
import type { ApiEnvelope, ApiErrorPayload, QueryValue, RequestOptions } from "./types";
import { tokenStore } from "./token";

const isSuccessCode = (code: number): boolean => code >= 200 && code < 300;

const isObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

const parseErrorMessage = (payload: ApiErrorPayload): string => {
  if (Array.isArray(payload.message)) {
    return payload.message.join("; ");
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return "请求失败，请稍后重试";
};

const buildUrl = (path: string, params?: Record<string, QueryValue>): string => {
  const url = new URL(path, apiConfig.baseURL);
  if (!params) return url.toString();
  Object.entries(params).forEach(([key, rawValue]) => {
    if (rawValue === null || rawValue === undefined) return;
    if (Array.isArray(rawValue)) {
      rawValue.forEach((value) => {
        url.searchParams.append(key, String(value));
      });
      return;
    }
    url.searchParams.set(key, String(rawValue));
  });
  return url.toString();
};

const toHeaders = (headers: HeadersInit | undefined): Headers => {
  if (headers instanceof Headers) return new Headers(headers);
  if (!headers) return new Headers();
  return new Headers(headers);
};

const toApiClientError = (error: unknown): ApiClientError => {
  if (error instanceof ApiClientError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiClientError({
      code: 408,
      message: "请求超时，请重试",
      status: 408,
      payload: error,
    });
  }
  return new ApiClientError({
    code: 0,
    message: "网络异常，请检查网络连接",
    payload: error,
  });
};

const withTimeoutSignal = (
  initSignal: AbortSignal | null,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => {
    controller.abort("timeout");
  }, timeoutMs);
  if (initSignal) {
    const onAbort = (): void => controller.abort(initSignal.reason);
    initSignal.addEventListener("abort", onAbort, { once: true });
    return {
      signal: controller.signal,
      cleanup: () => {
        window.clearTimeout(timeout);
        initSignal.removeEventListener("abort", onAbort);
      },
    };
  }
  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timeout),
  };
};

export const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { params, body, skipAuth = false, headers: rawHeaders, signal, ...rest } = options;
  const url = buildUrl(path, params);
  const headers = toHeaders(rawHeaders);
  const token = tokenStore.get();
  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const hasJsonBody = body !== undefined && !(body instanceof FormData);
  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const { signal: timeoutSignal, cleanup } = withTimeoutSignal(
    signal ?? null,
    apiConfig.timeoutMs,
  );
  try {
    const response = await fetch(url, {
      ...rest,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
      signal: timeoutSignal,
    });
    const raw = (await response.json().catch(() => null)) as ApiEnvelope<T> | ApiErrorPayload | null;
    if (!raw || !isObject(raw)) {
      throw new ApiClientError({
        code: response.status,
        status: response.status,
        message: "服务返回数据格式错误",
        payload: raw,
      });
    }
    if ("code" in raw && typeof raw.code === "number" && "data" in raw) {
      if (isSuccessCode(raw.code)) {
        return (raw as ApiEnvelope<T>).data;
      }
      throw new ApiClientError({
        code: raw.code,
        status: response.status,
        message: raw.message || "请求失败",
        payload: raw,
      });
    }
    const errorPayload = raw as ApiErrorPayload;
    throw new ApiClientError({
      code: errorPayload.code ?? errorPayload.statusCode ?? response.status,
      status: response.status,
      message: parseErrorMessage(errorPayload),
      payload: raw,
    });
  } catch (error) {
    throw toApiClientError(error);
  } finally {
    cleanup();
  }
};
