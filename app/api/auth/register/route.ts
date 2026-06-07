import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { isRegistrationAllowed } from "@/lib/edge-config";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // Check if registration is allowed
    const allowed = await isRegistrationAllowed();
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "注册功能暂未开放" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, confirmPassword } = body;

    // Validate input
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "请填写所有字段" },
        { status: 400 }
      );
    }

    if (username.length < 1 || username.length > 50) {
      return NextResponse.json(
        { success: false, error: "用户名长度需在1-50个字符之间" },
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

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "密码长度至少6个字符" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "两次输入的密码不一致" },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await sql`
      SELECT id FROM vph_users WHERE username = ${username} OR email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "用户名或邮箱已被注册" },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const result = await sql`
      INSERT INTO vph_users (username, email, password_hash)
      VALUES (${username}, ${email}, ${passwordHash})
      RETURNING id, username, email
    `;

    const user = result[0];

    // Auto-login after registration
    const sessionId = await createSession(user.id, user.username, user.email);

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email },
    });

    response.cookies.set("vph-session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("[vph] Register error:", error);
    return NextResponse.json(
      { success: false, error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
