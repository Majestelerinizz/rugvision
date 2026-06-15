import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type UpdateWidgetSettingsBody = {
  merchantId?: string;
  buttonColor?: string;
  buttonText?: string;
  borderRadius?: number;
  logoUrl?: string | null;
  darkMode?: boolean;
};

export async function GET(request: NextRequest) {
  const merchantId = request.nextUrl.searchParams.get("merchantId");

  if (!merchantId) {
    return NextResponse.json(
      { error: "merchantId query parametresi zorunludur." },
      { status: 400 }
    );
  }

  const settings = await prisma.widgetSettings.findUnique({
    where: { merchantId },
  });

  if (!settings) {
    return NextResponse.json(
      { error: "Widget ayari bulunamadi." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: settings }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as UpdateWidgetSettingsBody;

  if (!body.merchantId) {
    return NextResponse.json({ error: "merchantId zorunludur." }, { status: 400 });
  }

  try {
    const updated = await prisma.widgetSettings.update({
      where: { merchantId: body.merchantId },
      data: {
        buttonColor: body.buttonColor,
        buttonText: body.buttonText,
        borderRadius: body.borderRadius,
        logoUrl: body.logoUrl,
        darkMode: body.darkMode,
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Widget ayari guncellenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
