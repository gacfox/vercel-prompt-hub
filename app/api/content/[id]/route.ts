import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "edge";

export async function DELETE(
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
      SELECT author_id FROM vph_content WHERE id = ${contentId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "内容不存在" },
        { status: 404 }
      );
    }

    if (rows[0].author_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: "无权删除此内容" },
        { status: 403 }
      );
    }

    // Delete (cascade handles detail tables and likes)
    await sql`DELETE FROM vph_content WHERE id = ${contentId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[vph] Content delete error:", error);
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 }
    );
  }
}
