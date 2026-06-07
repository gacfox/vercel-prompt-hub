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
      model = "",
      prompt = "",
      fields = [],
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "请输入内容名称" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO vph_content (author_id, type, title, description, is_public)
      VALUES (${user.userId}, 'drawing', ${title.trim()}, ${description}, ${is_public})
      RETURNING id
    `;

    const contentId = result[0].id;

    const drawingResult = await sql`
      INSERT INTO vph_content_drawing (content_id, model, prompt)
      VALUES (${contentId}, ${model}, ${prompt})
      RETURNING id
    `;

    const drawingId = drawingResult[0].id;

    // Insert dynamic fields
    for (const field of fields as { field_key: string; field_value: string }[]) {
      if (field.field_key?.trim()) {
        await sql`
          INSERT INTO vph_content_drawing_fields (drawing_id, field_key, field_value)
          VALUES (${drawingId}, ${field.field_key.trim()}, ${field.field_value || ""})
        `;
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: contentId },
    });
  } catch (error) {
    console.error("[vph] Drawing publish error:", error);
    return NextResponse.json(
      { success: false, error: "发布失败" },
      { status: 500 }
    );
  }
}
