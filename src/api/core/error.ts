type ApiClientErrorArgs = {
  code: number;
  message: string;
  status?: number;
  payload?: unknown;
};

export class ApiClientError extends Error {
  readonly code: number;
  readonly status?: number;
  readonly payload?: unknown;

  constructor({ code, message, status, payload }: ApiClientErrorArgs) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.payload = payload;
  }
}

export const isApiClientError = (error: unknown): error is ApiClientError => {
  return error instanceof ApiClientError;
};
