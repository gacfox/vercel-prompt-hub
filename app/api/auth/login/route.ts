import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { success: false, error: "请输入用户名/邮箱和密码" },
        { status: 400 }
      );
    }

    // Find user by username or email
    const users = await sql`
      SELECT id, username, email, password_hash
      FROM vph_users
      WHERE username = ${usernameOrEmail} OR email = ${usernameOrEmail}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    const user = users[0];
    const passwordHash = await hashPassword(password);

    if (user.password_hash !== passwordHash) {
      return NextResponse.json(
        { success: false, error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = await createSession(user.id, user.username, user.email);

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email },
    });

    // Set httpOnly cookie
    response.cookies.set("vph-session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[vph] Login error:", error);
    return NextResponse.json(
      { success: false, error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
