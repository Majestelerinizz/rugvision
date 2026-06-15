import { NextResponse } from "next/server";

// Standart API hata kodlari (Faz 2 - hata standardizasyonu).
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status: STATUS_BY_CODE[code] }
  );
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

// HTTP hatasini, throw edilebilen tasiyiciya sarmak icin.
export class HttpError extends Error {
  code: ApiErrorCode;
  details?: unknown;
  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return apiError(error.code, error.message, error.details);
  }
  return apiError("INTERNAL", "Beklenmeyen bir hata olustu.");
}
