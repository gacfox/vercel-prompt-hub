import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AgentSkillForm } from "@/components/publish/agent-skill-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { getCurrentUser } from "@/lib/auth";

export default async function PublishAgentSkillPage() {
  const headersList = await headers();
  const user = await getCurrentUser(headersList);

  if (!user) {
    redirect("/login");
  }

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
              <BreadcrumbLink href="/content/publish">发布内容</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Agent Skills</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-2xl font-bold">发布 Agent Skill</h1>
          <AgentSkillForm />
        </div>
      </div>
    </div>
  );
}
