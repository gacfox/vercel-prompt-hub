"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Layers,
  FileText,
  Palette,
  Bot,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentType } from "@/lib/types";

interface SidebarItem {
  label: string;
  type: ContentType | "all";
  icon: React.ElementType;
}

const items: SidebarItem[] = [
  { label: "全部", type: "all", icon: Layers },
  { label: "文本", type: "text", icon: FileText },
  { label: "绘图", type: "drawing", icon: Palette },
  { label: "Agent Skills", type: "agent_skill", icon: Bot },
  { label: "Shell命令", type: "shell", icon: Terminal },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "all";

  // Only show active state on the home page
  const isHomePage = pathname === "/";

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-card">
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isHomePage && currentType === item.type;
          const href =
            item.type === "all" ? "/" : `/?type=${item.type}`;

          return (
            <Link
              key={item.type}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
