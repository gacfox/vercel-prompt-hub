import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/lib/auth";

export const runtime = "edge";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("vph-session")?.value;

    if (sessionId) {
      await destroySession(sessionId);
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("vph-session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[vph] Logout error:", error);
    return NextResponse.json(
      { success: false, error: "登出失败" },
      { status: 500 }
    );
  }
}
