import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "edge";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const contentId = parseInt(id, 10);

    if (isNaN(contentId)) {
      return NextResponse.json(
        { success: false, error: "无效的内容ID" },
        { status: 400 }
      );
    }

    // Verify ownership
    const rows = await sql`
      SELECT type, author_id FROM vph_content WHERE id = ${contentId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "内容不存在" },
        { status: 404 }
      );
    }

    if (rows[0].author_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: "无权编辑此内容" },
        { status: 403 }
      );
    }

    const contentType = rows[0].type;
    const body = await request.json();
    const { title, description, is_public } = body;

    // Update main content table
    await sql`
      UPDATE vph_content
      SET title = ${title}, description = ${description || ""}, is_public = ${is_public ?? true}, updated_at = NOW()
      WHERE id = ${contentId}
    `;

    // Update type-specific detail
    if (contentType === "text") {
      const { system_prompt, user_prompt } = body;
      await sql`
        UPDATE vph_content_text
        SET system_prompt = ${system_prompt || ""}, user_prompt = ${user_prompt || ""}
        WHERE content_id = ${contentId}
      `;
    } else if (contentType === "drawing") {
      const { model, prompt, fields } = body;
      await sql`
        UPDATE vph_content_drawing
        SET model = ${model || ""}, prompt = ${prompt || ""}
        WHERE content_id = ${contentId}
      `;

      // Get drawing id
      const drawingRows = await sql`
        SELECT id FROM vph_content_drawing WHERE content_id = ${contentId}
      `;

      if (drawingRows.length > 0) {
        const drawingId = drawingRows[0].id;

        // Delete old fields and insert new ones
        await sql`DELETE FROM vph_content_drawing_fields WHERE drawing_id = ${drawingId}`;

        for (const field of (fields || []) as { field_key: string; field_value: string }[]) {
          if (field.field_key?.trim()) {
            await sql`
              INSERT INTO vph_content_drawing_fields (drawing_id, field_key, field_value)
              VALUES (${drawingId}, ${field.field_key.trim()}, ${field.field_value || ""})
            `;
          }
        }
      }
    } else if (contentType === "agent_skill") {
      const { files } = body;

      // Get agent skill id
      const skillRows = await sql`
        SELECT id FROM vph_content_agent_skill WHERE content_id = ${contentId}
      `;

      if (skillRows.length > 0) {
        const agentSkillId = skillRows[0].id;

        // Delete old files and insert new ones
        await sql`DELETE FROM vph_agent_skill_files WHERE agent_skill_id = ${agentSkillId}`;

        for (const file of (files || []) as { file_path: string; content: string; is_directory: boolean }[]) {
          if (file.file_path?.trim()) {
            await sql`
              INSERT INTO vph_agent_skill_files (agent_skill_id, file_path, content, is_directory)
              VALUES (${agentSkillId}, ${file.file_path.trim()}, ${file.content || ""}, ${file.is_directory || false})
            `;
          }
        }
      }
    } else if (contentType === "shell") {
      const { shell_type, command } = body;
      const validShellTypes = ["cmd", "powershell", "bash"];
      const safeShellType = validShellTypes.includes(shell_type) ? shell_type : "bash";

      await sql`
        UPDATE vph_content_shell
        SET shell_type = ${safeShellType}, command = ${command || ""}
        WHERE content_id = ${contentId}
      `;
    }

    return NextResponse.json({ success: true, data: { id: contentId } });
  } catch (error) {
    console.error("[vph] Content update error:", error);
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 }
    );
  }
}
