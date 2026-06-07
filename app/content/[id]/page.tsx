import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getGravatarUrl } from "@/lib/gravatar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { TextDetail } from "@/components/content/text-detail";
import { DrawingDetail } from "@/components/content/drawing-detail";
import { AgentSkillDetail } from "@/components/content/agent-skill-detail";
import { ShellDetail } from "@/components/content/shell-detail";
import { LikeButton } from "@/components/content/like-button";
import { EditDeleteButtons } from "@/components/content/edit-delete-buttons";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

interface ContentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const { id } = await params;
  const contentId = parseInt(id, 10);

  if (isNaN(contentId)) {
    notFound();
  }

  const headersList = await headers();
  const user = await getCurrentUser(headersList);

  // Fetch content with author info
  let content;
  try {
    const rows = await sql`
      SELECT c.*, u.username as author_name, u.email as author_email,
             COALESCE(lc.like_count, 0) as like_count
      FROM vph_content c
      JOIN vph_users u ON c.author_id = u.id
      LEFT JOIN (SELECT content_id, COUNT(*) as like_count FROM vph_likes GROUP BY content_id) lc ON c.id = lc.content_id
      WHERE c.id = ${contentId}
    `;

    if (rows.length === 0) {
      notFound();
    }

    content = rows[0];
  } catch {
    notFound();
  }

  // Serialize to plain objects for Client Component props
  content = JSON.parse(JSON.stringify(content));

  // Check visibility
  if (!content.is_public && (!user || user.userId !== content.author_id)) {
    notFound();
  }

  const isAuthor = user && user.userId === content.author_id;
  const likedByMe = user
    ? (await sql`
        SELECT 1 FROM vph_likes WHERE user_id = ${user.userId} AND content_id = ${contentId}
      `).length > 0
    : false;

  // Fetch type-specific detail
  let detail = null;
  if (content.type === "text") {
    const rows = await sql`
      SELECT * FROM vph_content_text WHERE content_id = ${contentId}
    `;
    detail = rows[0] || null;
  } else if (content.type === "drawing") {
    const drawingRows = await sql`
      SELECT * FROM vph_content_drawing WHERE content_id = ${contentId}
    `;
    const fieldRows = drawingRows.length > 0
      ? await sql`
          SELECT * FROM vph_content_drawing_fields WHERE drawing_id = ${drawingRows[0].id}
        `
      : [];
    detail = drawingRows[0]
      ? { ...drawingRows[0], fields: fieldRows }
      : null;
  } else if (content.type === "agent_skill") {
    const skillRows = await sql`
      SELECT * FROM vph_content_agent_skill WHERE content_id = ${contentId}
    `;
    const fileRows = skillRows.length > 0
      ? await sql`
          SELECT * FROM vph_agent_skill_files WHERE agent_skill_id = ${skillRows[0].id} ORDER BY file_path
        `
      : [];
    detail = skillRows[0]
      ? { ...skillRows[0], files: fileRows }
      : null;
  } else if (content.type === "shell") {
    const rows = await sql`
      SELECT * FROM vph_content_shell WHERE content_id = ${contentId}
    `;
    detail = rows[0] || null;
  }

  // Serialize detail to plain objects
  detail = JSON.parse(JSON.stringify(detail));

  const typeLabels: Record<string, string> = {
    text: "文本",
    drawing: "绘图",
    agent_skill: "Agent Skills",
    shell: "Shell命令",
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="border-b px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">首页</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/?type=${content.type}`}>
                {typeLabels[content.type]}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{content.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{content.title}</h1>
                  {!content.is_public && (
                    <Badge variant="outline">私有</Badge>
                  )}
                </div>
                {content.description && (
                  <p className="break-all text-muted-foreground">{content.description}</p>
                )}
              </div>

              {isAuthor && <EditDeleteButtons contentId={contentId} />}
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={getGravatarUrl(content.author_email, 64)}
                    alt={content.author_name}
                  />
                  <AvatarFallback>
                    {content.author_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{content.author_name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(content.created_at).toLocaleString("zh-CN")}
              </span>
              <LikeButton
                contentId={contentId}
                initialLiked={likedByMe}
                initialCount={content.like_count}
              />
            </div>
          </div>

          <Separator />

          {/* Type-specific detail */}
          {content.type === "text" && detail && (
            <TextDetail systemPrompt={detail.system_prompt} userPrompt={detail.user_prompt} />
          )}
          {content.type === "drawing" && detail && (
            <DrawingDetail
              model={detail.model}
              prompt={detail.prompt}
              fields={detail.fields}
            />
          )}
          {content.type === "agent_skill" && detail && (
            <AgentSkillDetail files={detail.files} />
          )}
          {content.type === "shell" && detail && (
            <ShellDetail shellType={detail.shell_type} command={detail.command} />
          )}
        </div>
      </div>
    </div>
  );
}
