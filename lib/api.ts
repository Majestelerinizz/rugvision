import { NextResponse } from "next/server";
import { ApiErrorCode, STATUS_BY_CODE, HttpError } from "./errors";

// Geriye donuk uyumluluk: bu tipler/sinif eskiden burada tanimliydi.
export { HttpError };
export type { ApiErrorCode };

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

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return apiError(error.code, error.message, error.details);
  }
  return apiError("INTERNAL", "Beklenmeyen bir hata olustu.");
}
