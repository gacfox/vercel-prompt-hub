import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export const runtime = "edge";

export async function PUT(request: Request) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "请填写所有字段" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "新密码至少6个字符" },
        { status: 400 }
      );
    }

    // Verify current password
    const users = await sql`
      SELECT password_hash FROM vph_users WHERE id = ${user.userId}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== users[0].password_hash) {
      return NextResponse.json(
        { success: false, error: "当前密码错误" },
        { status: 401 }
      );
    }

    // Update password
    const newHash = await hashPassword(newPassword);
    await sql`
      UPDATE vph_users SET password_hash = ${newHash}, updated_at = NOW()
      WHERE id = ${user.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[vph] Change password error:", error);
    return NextResponse.json(
      { success: false, error: "修改密码失败" },
      { status: 500 }
    );
  }
}
