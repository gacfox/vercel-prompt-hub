import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TextForm } from "@/components/publish/text-form";
import { DrawingForm } from "@/components/publish/drawing-form";
import { AgentSkillForm } from "@/components/publish/agent-skill-form";
import { ShellForm } from "@/components/publish/shell-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface EditContentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContentPage({ params }: EditContentPageProps) {
  const { id } = await params;
  const contentId = parseInt(id, 10);

  if (isNaN(contentId)) {
    notFound();
  }

  const headersList = await headers();
  const user = await getCurrentUser(headersList);

  if (!user) {
    redirect("/login");
  }

  // Fetch content
  let content;
  try {
    const rows = await sql`
      SELECT * FROM vph_content WHERE id = ${contentId}
    `;
    if (rows.length === 0) notFound();
    content = rows[0];
  } catch {
    notFound();
  }

  // Serialize to plain objects for Client Component props
  content = JSON.parse(JSON.stringify(content));

  // Check ownership
  if (content.author_id !== user.userId) {
    notFound();
  }

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
      ? await sql`SELECT * FROM vph_content_drawing_fields WHERE drawing_id = ${drawingRows[0].id}`
      : [];
    detail = drawingRows[0] ? { ...drawingRows[0], fields: fieldRows } : null;
  } else if (content.type === "agent_skill") {
    const skillRows = await sql`
      SELECT * FROM vph_content_agent_skill WHERE content_id = ${contentId}
    `;
    const fileRows = skillRows.length > 0
      ? await sql`SELECT * FROM vph_agent_skill_files WHERE agent_skill_id = ${skillRows[0].id} ORDER BY file_path`
      : [];
    detail = skillRows[0] ? { ...skillRows[0], files: fileRows } : null;
  } else if (content.type === "shell") {
    const rows = await sql`
      SELECT * FROM vph_content_shell WHERE content_id = ${contentId}
    `;
    detail = rows[0] || null;
  }

  // Serialize detail to plain objects for Client Component props
  detail = JSON.parse(JSON.stringify(detail));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialData: any = {
    title: content.title,
    description: content.description,
    is_public: content.is_public,
    detail,
  };

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
              <BreadcrumbLink href={`/content/${contentId}`}>
                {content.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>编辑{typeLabels[content.type]}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 p-6">
        <div className={content.type === "agent_skill" ? "mx-auto max-w-3xl" : "mx-auto max-w-2xl"}>
          <h1 className="mb-6 text-2xl font-bold">编辑{typeLabels[content.type]}</h1>

          {content.type === "text" && (
            <TextForm initialData={initialData} contentId={contentId} />
          )}
          {content.type === "drawing" && (
            <DrawingForm initialData={initialData} contentId={contentId} />
          )}
          {content.type === "agent_skill" && (
            <AgentSkillForm initialData={initialData} contentId={contentId} />
          )}
          {content.type === "shell" && (
            <ShellForm initialData={initialData} contentId={contentId} />
          )}
        </div>
      </div>
    </div>
  );
}
