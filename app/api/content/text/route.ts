import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: Request) {
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
    const { title, description = "", is_public = true, system_prompt = "", user_prompt = "" } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "请输入内容名称" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO vph_content (author_id, type, title, description, is_public)
      VALUES (${user.userId}, 'text', ${title.trim()}, ${description}, ${is_public})
      RETURNING id
    `;

    const contentId = result[0].id;

    await sql`
      INSERT INTO vph_content_text (content_id, system_prompt, user_prompt)
      VALUES (${contentId}, ${system_prompt}, ${user_prompt})
    `;

    return NextResponse.json({
      success: true,
      data: { id: contentId },
    });
  } catch (error) {
    console.error("[vph] Text publish error:", error);
    return NextResponse.json(
      { success: false, error: "发布失败" },
      { status: 500 }
    );
  }
}
