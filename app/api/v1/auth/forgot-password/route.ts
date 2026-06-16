import { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, toErrorResponse } from "@/lib/api";
import { parseJsonBody } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(`forgot:${clientIp(request)}`, 5, 10 * 60 * 1000);
    await parseJsonBody(request, forgotPasswordSchema);

    // Guvenlik: hesabin var olup olmadigini sizdirmamak icin her zaman ayni
    // notr yaniti doneriz. (E-posta servisi entegrasyonu Faz 3'te eklenecek.)
    return apiOk({
      message:
        "Eger bu e-posta kayitliysa, sifre sifirlama talimatlari gonderilecektir.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
