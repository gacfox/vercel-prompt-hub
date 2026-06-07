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
    const {
      title,
      description = "",
      is_public = true,
      files = [],
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "请输入内容名称" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO vph_content (author_id, type, title, description, is_public)
      VALUES (${user.userId}, 'agent_skill', ${title.trim()}, ${description}, ${is_public})
      RETURNING id
    `;

    const contentId = result[0].id;

    const skillResult = await sql`
      INSERT INTO vph_content_agent_skill (content_id)
      VALUES (${contentId})
      RETURNING id
    `;

    const agentSkillId = skillResult[0].id;

    // Insert files
    for (const file of files as { file_path: string; content: string; is_directory: boolean }[]) {
      if (file.file_path?.trim()) {
        await sql`
          INSERT INTO vph_agent_skill_files (agent_skill_id, file_path, content, is_directory)
          VALUES (${agentSkillId}, ${file.file_path.trim()}, ${file.content || ""}, ${file.is_directory || false})
        `;
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: contentId },
    });
  } catch (error) {
    console.error("[vph] Agent skill publish error:", error);
    return NextResponse.json(
      { success: false, error: "发布失败" },
      { status: 500 }
    );
  }
}
