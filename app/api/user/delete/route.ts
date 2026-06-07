import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { getCurrentUser, destroySession } from "@/lib/auth";

export const runtime = "edge";

export async function DELETE() {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    // Delete user (cascade handles content, likes, etc.)
    await sql`DELETE FROM vph_users WHERE id = ${user.userId}`;

    // Destroy session
    const cookieHeader = headersList.get("cookie") || "";
    const match = cookieHeader.match(/vph-session=([^;]+)/);
    if (match) {
      await destroySession(match[1]);
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
    console.error("[vph] Delete account error:", error);
    return NextResponse.json(
      { success: false, error: "删除账号失败" },
      { status: 500 }
    );
  }
}
