import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const users = await sql`
      SELECT id, username, email, created_at, updated_at
      FROM vph_users WHERE id = ${user.userId}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error("[vph] Get user error:", error);
    return NextResponse.json(
      { success: false, error: "获取用户信息失败" },
      { status: 500 }
    );
  }
}

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
    const { username, email } = body;

    if (!username?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, error: "用户名和邮箱不能为空" },
        { status: 400 }
      );
    }

    if (username.length > 50) {
      return NextResponse.json(
        { success: false, error: "用户名不能超过50个字符" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }

    // Check uniqueness (exclude current user)
    const existing = await sql`
      SELECT id FROM vph_users
      WHERE (username = ${username.trim()} OR email = ${email.trim()})
      AND id != ${user.userId}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "用户名或邮箱已被使用" },
        { status: 409 }
      );
    }

    await sql`
      UPDATE vph_users
      SET username = ${username.trim()}, email = ${email.trim()}, updated_at = NOW()
      WHERE id = ${user.userId}
    `;

    // Update session in Redis
    const { createSession, destroySession } = await import("@/lib/auth");
    const { redis } = await import("@/lib/redis");

    // Find and update existing session
    const cookieHeader = headersList.get("cookie") || "";
    const match = cookieHeader.match(/vph-session=([^;]+)/);
    if (match) {
      const sessionId = match[1];
      await destroySession(sessionId);
      const newSessionId = await createSession(user.userId, username.trim(), email.trim());

      // We can't set cookies from a PUT handler directly in a clean way,
      // but the middleware will refresh on next request.
      // For now, update the Redis key directly.
      // Actually, let's just update the session data in place:
      const { redis: redisClient } = await import("@/lib/redis");
      await redisClient.set(`vph:session:${sessionId}`, JSON.stringify({
        userId: user.userId,
        username: username.trim(),
        email: email.trim(),
      }), { ex: 7 * 24 * 60 * 60 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[vph] Update user error:", error);
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 }
    );
  }
}
