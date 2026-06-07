import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import type { ContentListItem } from "@/lib/types";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const type = searchParams.get("type");
    const keyword = searchParams.get("keyword");
    const scope = searchParams.get("scope") || "all";
    const order = searchParams.get("order") === "asc" ? "ASC" : "DESC";

    const headersList = await headers();
    const user = await getCurrentUser(headersList);

    // Build conditions
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Visibility
    if (scope === "mine" && user) {
      // "我的": only current user's content (public + private)
      conditions.push(`c.author_id = ${user.userId}`);
    } else if (user) {
      // "全部" + logged in: public + own private
      conditions.push(`(c.is_public = true OR c.author_id = ${user.userId})`);
    } else {
      // "全部" + not logged in: public only
      conditions.push("c.is_public = true");
    }

    // Type filter
    const validTypes = ["text", "drawing", "agent_skill", "shell"];
    if (type && validTypes.includes(type)) {
      conditions.push(`c.type = '${type}'`);
    }

    // Keyword search (parameterized to avoid SQL injection)
    if (keyword && keyword.trim()) {
      const safeKeyword = keyword.trim().replace(/'/g, "''");
      conditions.push(
        `(c.title ILIKE '%${safeKeyword}%' OR c.description ILIKE '%${safeKeyword}%')`
      );
    }

    // Cursor pagination
    if (cursor) {
      const [cursorTime, cursorId] = cursor.split("_");
      const cursorTimeStr = decodeURIComponent(cursorTime);
      const cursorIdNum = parseInt(cursorId, 10);

      if (order === "DESC") {
        conditions.push(
          `(c.created_at, c.id) < ('${cursorTimeStr}', ${cursorIdNum})`
        );
      } else {
        conditions.push(
          `(c.created_at, c.id) > ('${cursorTimeStr}', ${cursorIdNum})`
        );
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT c.id, c.type, c.title, c.description, c.is_public, c.created_at, c.updated_at,
             u.username as author_name, u.email as author_email,
             COALESCE(lc.like_count, 0) as like_count
      FROM vph_content c
      JOIN vph_users u ON c.author_id = u.id
      LEFT JOIN (SELECT content_id, COUNT(*) as like_count FROM vph_likes GROUP BY content_id) lc ON c.id = lc.content_id
      ${whereClause}
      ORDER BY c.created_at ${order}, c.id ${order}
      LIMIT ${limit + 1}
    `;

    const items = (await sql.query(query)) as unknown as ContentListItem[];

    const hasMore = items.length > limit;
    const displayItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && displayItems.length > 0
        ? `${displayItems[displayItems.length - 1].created_at}_${displayItems[displayItems.length - 1].id}`
        : null;

    return NextResponse.json({
      success: true,
      data: {
        items: displayItems,
        nextCursor,
      },
    });
  } catch (error) {
    console.error("[vph] Content list error:", error);
    return NextResponse.json(
      { success: false, error: "获取内容列表失败" },
      { status: 500 }
    );
  }
}
