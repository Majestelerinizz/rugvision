import { NextRequest } from "next/server";
import { z } from "zod";
import { HttpError } from "./api";

// JSON govdesini guvenli sekilde okur ve zod ile dogrular.
// Hata durumunda standart HttpError firlatir (ham mesaj sizmaz).
export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new HttpError("BAD_REQUEST", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(
      "UNPROCESSABLE",
      "Gonderilen veri dogrulanamadi.",
      parsed.error.flatten()
    );
  }

  return parsed.data;
}
