import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const parse = resetPasswordSchema.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(
      { error: "Gecersiz body", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message:
        "MVP asamasinda reset token akisi entegre degil. Email provider ve token tablosu eklendiginde tamamlanacak.",
    },
    { status: 200 }
  );
}
