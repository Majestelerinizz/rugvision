import { NextRequest } from "next/server";
import { AiScanType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import { parseJsonBody } from "@/lib/validation";
import { detectFloorPlane, detectRoomContext } from "@/lib/ai-detection";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

const scanSchema = z.object({
  merchantId: z.string().min(1),
  rugId: z.string().optional(),
  scanType: z.enum(["FLOOR_DETECTION", "ROOM_DETECTION"]),
  inputImageUrl: z.string().max(2000).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(`ai-scan:${clientIp(request)}`, 60, 60 * 1000);

    const body = await parseJsonBody(request, scanSchema);

    if (body.rugId) {
      const rug = await prisma.rug.findFirst({
        where: { id: body.rugId, merchantId: body.merchantId },
        select: { id: true },
      });
      if (!rug) {
        throw new HttpError("NOT_FOUND", "Hali bulunamadi.");
      }
    }

    const ctx = (body.context || {}) as Record<string, unknown>;
    const platform = String(ctx.platform || "");

    const result =
      body.scanType === "FLOOR_DETECTION"
        ? detectFloorPlane({
            platform,
            hasGyroscope: Boolean(ctx.hasGyroscope),
            screenWidth: Number(ctx.screenWidth) || undefined,
            screenHeight: Number(ctx.screenHeight) || undefined,
            imageBottomLuma: Number(ctx.imageBottomLuma) || undefined,
            imageBottomVariance: Number(ctx.imageBottomVariance) || undefined,
          })
        : detectRoomContext({
            platform,
            aspectRatio: Number(ctx.aspectRatio) || undefined,
            portrait: Boolean(ctx.portrait),
          });

    const saved = await prisma.aiScan.create({
      data: {
        merchantId: body.merchantId,
        rugId: body.rugId,
        scanType: body.scanType as AiScanType,
        inputImageUrl: body.inputImageUrl,
        result: result as object,
      },
    });

    return apiOk({ scanId: saved.id, ...result }, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get("merchantId");
    if (!merchantId) {
      return apiOk({ items: [] });
    }

    const take = Math.min(
      50,
      Number(request.nextUrl.searchParams.get("limit") || 20)
    );
    const scanType = request.nextUrl.searchParams.get("scanType");

    const items = await prisma.aiScan.findMany({
      where: {
        merchantId,
        ...(scanType ? { scanType: scanType as AiScanType } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        rugId: true,
        scanType: true,
        result: true,
        createdAt: true,
      },
    });

    return apiOk({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}
