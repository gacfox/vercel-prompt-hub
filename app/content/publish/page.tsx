import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FileText, Palette, Bot, Terminal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { getCurrentUser } from "@/lib/auth";

const contentTypes = [
  {
    type: "text",
    label: "文本",
    description: "System 和 User 提示词",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    type: "drawing",
    label: "绘图",
    description: "模型 + 提示词 + 动态字段",
    icon: Palette,
    color: "text-purple-500",
  },
  {
    type: "agent-skill",
    label: "Agent Skills",
    description: "文件目录结构 + 代码内容",
    icon: Bot,
    color: "text-green-500",
  },
  {
    type: "shell",
    label: "Shell命令",
    description: "CMD / PowerShell / Bash",
    icon: Terminal,
    color: "text-orange-500",
  },
];

export default async function PublishPage() {
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
              <BreadcrumbPage>发布内容</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-2xl font-bold">选择内容类型</h1>
          <p className="mb-6 text-muted-foreground">选择你要发布的内容类型</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contentTypes.map((ct) => {
              const Icon = ct.icon;
              return (
                <Link key={ct.type} href={`/content/publish/${ct.type}`}>
                  <Card className="transition-shadow hover:shadow-md cursor-pointer">
                    <CardContent className="flex items-start gap-4 p-6">
                      <Icon className={`h-8 w-8 shrink-0 ${ct.color}`} />
                      <div>
                        <h3 className="font-semibold">{ct.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ct.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
