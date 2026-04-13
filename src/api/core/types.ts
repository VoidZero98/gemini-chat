export type ApiSuccessCode = number;

export type ApiEnvelope<T> = {
  code: ApiSuccessCode;
  message: string;
  data: T;
};

export type ApiErrorPayload = {
  code?: number;
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export type RequestOptions = Omit<RequestInit, "body"> & {
  params?: Record<string, QueryValue>;
  body?: unknown;
  skipAuth?: boolean;
};
