import { headers } from "next/headers";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getGravatarUrl } from "@/lib/gravatar";
import { ContentList } from "@/components/content/content-list";
import { ContentFilters } from "@/components/content/content-filters";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import type { ContentType, ContentListItem } from "@/lib/types";

interface HomePageProps {
  searchParams: Promise<{
    type?: string;
    keyword?: string;
    scope?: string;
    order?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const headersList = await headers();
  const user = await getCurrentUser(headersList);

  const type = (params.type || "all") as ContentType | "all";
  const keyword = params.keyword || "";
  const scope = params.scope || "all";
  const order = params.order || "desc";

  // Fetch initial page of content
  const validTypes = ["text", "drawing", "agent_skill", "shell"];
  const typeFilter = validTypes.includes(type) ? type : null;
  const showMine = scope === "mine" && user;
  const keywordFilter = keyword.trim() || null;

  // Build query conditions
  let whereConditions = ["1=1"];

  if (showMine) {
    // "我的": only current user's content (public + private)
    whereConditions.push(`c.author_id = ${user.userId}`);
  } else if (user) {
    // "全部" + logged in: public + own private
    whereConditions.push(`(c.is_public = true OR c.author_id = ${user.userId})`);
  } else {
    // "全部" + not logged in: public only
    whereConditions.push("c.is_public = true");
  }

  if (typeFilter) {
    whereConditions.push(`c.type = '${typeFilter}'`);
  }

  if (keywordFilter) {
    whereConditions.push(
      `(c.title ILIKE '%${keywordFilter.replace(/'/g, "''")}%' OR c.description ILIKE '%${keywordFilter.replace(/'/g, "''")}%')`
    );
  }

  const orderDirection = order === "asc" ? "ASC" : "DESC";

  const whereClause = whereConditions.join(" AND ");

  const query = `
    SELECT c.id, c.type, c.title, c.description, c.is_public, c.created_at, c.updated_at,
           u.username as author_name, u.email as author_email,
           COALESCE(lc.like_count, 0) as like_count
    FROM vph_content c
    JOIN vph_users u ON c.author_id = u.id
    LEFT JOIN (SELECT content_id, COUNT(*) as like_count FROM vph_likes GROUP BY content_id) lc ON c.id = lc.content_id
    WHERE ${whereClause}
    ORDER BY c.created_at ${orderDirection}, c.id ${orderDirection}
    LIMIT 21
  `;

  let items: ContentListItem[] = [];
  try {
    const raw = await sql.query(query);
    // Serialize to plain objects for Client Component props
    const parsed = JSON.parse(JSON.stringify(raw));
    items = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[vph] Content fetch error:", error);
    // Tables might not exist yet
    items = [];
  }

  const hasMore = items.length > 20;
  const displayItems = hasMore ? items.slice(0, 20) : items;
  const nextCursor =
    hasMore && displayItems.length > 0
      ? `${displayItems[displayItems.length - 1].created_at}_${displayItems[displayItems.length - 1].id}`
      : null;

  return (
    <div className="flex flex-col flex-1">
      <div className="border-b px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>
                {type === "all"
                  ? "全部内容"
                  : type === "text"
                    ? "文本"
                    : type === "drawing"
                      ? "绘图"
                      : type === "agent_skill"
                        ? "Agent Skills"
                        : "Shell命令"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Suspense>
        <ContentFilters
          initialType={type}
          initialKeyword={keyword}
          initialScope={scope as "all" | "mine"}
          initialOrder={order as "asc" | "desc"}
          isLoggedIn={!!user}
        />
      </Suspense>

      <div className="flex-1 p-6">
        <ContentList
          initialItems={displayItems}
          initialNextCursor={nextCursor}
          type={type}
          keyword={keyword}
          scope={scope as "all" | "mine"}
          order={order as "asc" | "desc"}
        />
      </div>
    </div>
  );
}
