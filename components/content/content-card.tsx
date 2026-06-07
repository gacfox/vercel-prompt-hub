import Link from "next/link";
import { Heart, Clock, FileText, Palette, Bot, Terminal, Lock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getGravatarUrl } from "@/lib/gravatar";
import type { ContentListItem } from "@/lib/types";

const typeIcons: Record<string, React.ElementType> = {
  text: FileText,
  drawing: Palette,
  agent_skill: Bot,
  shell: Terminal,
};

const typeIconColors: Record<string, string> = {
  text: "text-blue-500",
  drawing: "text-purple-500",
  agent_skill: "text-emerald-500",
  shell: "text-amber-500",
};

interface ContentCardProps {
  item: ContentListItem;
}

export function ContentCard({ item }: ContentCardProps) {
  const timeAgo = getTimeAgo(new Date(item.created_at));
  const Icon = typeIcons[item.type] || FileText;
  const iconColor = typeIconColors[item.type] || "text-muted-foreground";

  return (
    <Link href={`/content/${item.id}`} className="group block">
      <div className="flex h-[140px] flex-col rounded-lg border bg-card transition-all hover:border-primary/30 hover:shadow-sm">
        {/* 内容区 */}
        <div className="flex-1 p-4 pb-2">
          {/* 标题行：图标 + 标题 */}
          <div className="mb-1.5 flex items-start gap-2">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
            <h3 className="line-clamp-1 text-sm font-medium leading-snug group-hover:text-primary">
              {item.title}
            </h3>
            {!item.is_public && (
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>

          {/* 描述（最多2行） */}
          <p className="line-clamp-2 break-all pl-6 text-xs leading-relaxed text-muted-foreground">
            {item.description || "暂无简介"}
          </p>
        </div>

        {/* Footer：作者信息 + 互动数据 */}
        <div className="flex items-center justify-between border-t px-4 py-2">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-4 w-4">
              <AvatarImage
                src={getGravatarUrl(item.author_email, 32)}
                alt={item.author_name}
              />
              <AvatarFallback className="text-[8px]">
                {item.author_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {item.author_name}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" />
              {item.like_count}
            </span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN");
}
