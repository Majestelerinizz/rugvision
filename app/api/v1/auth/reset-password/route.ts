import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, toErrorResponse } from "@/lib/api";
import { parseJsonBody } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

const resetPasswordSchema = z.object({
  token: z.string().min(8),
  newPassword: z
    .string()
    .min(8)
    .max(100)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(`reset:${clientIp(request)}`, 5, 10 * 60 * 1000);
    await parseJsonBody(request, resetPasswordSchema);

    // Token tablosu + e-posta saglayici entegrasyonu Faz 3'te tamamlanacak.
    // Su an akis bilincli olarak devre disi; sahte basari donmemek icin acik mesaj.
    return apiError(
      "UNPROCESSABLE",
      "Sifre sifirlama akisi henuz aktif degil (Faz 3'te etkinlestirilecek)."
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
