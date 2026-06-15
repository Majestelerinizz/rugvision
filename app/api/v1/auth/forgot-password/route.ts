import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const parse = forgotPasswordSchema.safeParse(await request.json());
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
        "MVP asamasinda e-posta servisi entegre edilmedi. Bu endpoint daha sonra provider ile tamamlanacak.",
    },
    { status: 200 }
  );
}
