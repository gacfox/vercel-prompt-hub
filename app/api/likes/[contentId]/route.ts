import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const id = parseInt(contentId, 10);

    const headersList = await headers();
    const user = await getCurrentUser(headersList);

    // Get like count
    const countRows = await sql`
      SELECT COUNT(*) as count FROM vph_likes WHERE content_id = ${id}
    `;
    const count = Number(countRows[0]?.count || 0);

    // Check if current user liked
    let liked = false;
    if (user) {
      const likedRows = await sql`
        SELECT 1 FROM vph_likes WHERE user_id = ${user.userId} AND content_id = ${id}
      `;
      liked = likedRows.length > 0;
    }

    return NextResponse.json({
      success: true,
      data: { liked, count },
    });
  } catch (error) {
    console.error("[vph] Like status error:", error);
    return NextResponse.json(
      { success: false, error: "获取点赞状态失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const id = parseInt(contentId, 10);

    const headersList = await headers();
    const user = await getCurrentUser(headersList);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    // Check if already liked
    const existing = await sql`
      SELECT 1 FROM vph_likes WHERE user_id = ${user.userId} AND content_id = ${id}
    `;

    if (existing.length > 0) {
      // Unlike
      await sql`
        DELETE FROM vph_likes WHERE user_id = ${user.userId} AND content_id = ${id}
      `;
    } else {
      // Like
      await sql`
        INSERT INTO vph_likes (user_id, content_id) VALUES (${user.userId}, ${id})
      `;
    }

    // Get updated count
    const countRows = await sql`
      SELECT COUNT(*) as count FROM vph_likes WHERE content_id = ${id}
    `;
    const count = Number(countRows[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: {
        liked: existing.length === 0,
        count,
      },
    });
  } catch (error) {
    console.error("[vph] Like toggle error:", error);
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 }
    );
  }
}
