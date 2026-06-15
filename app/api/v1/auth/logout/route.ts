import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: true, message: "Logout istemci tarafinda token silerek tamamlanir." },
    { status: 200 }
  );
}
