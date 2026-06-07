"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContentType } from "@/lib/types";

interface ContentFiltersProps {
  initialType: ContentType | "all";
  initialKeyword: string;
  initialScope: "all" | "mine";
  initialOrder: "asc" | "desc";
  isLoggedIn: boolean;
}

export function ContentFilters({
  initialType,
  initialKeyword,
  initialScope,
  initialOrder,
  isLoggedIn,
}: ContentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(initialKeyword);
  const [scope, setScope] = useState(initialScope);
  const [order, setOrder] = useState(initialOrder);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (initialType !== "all") params.set("type", initialType);
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (scope === "mine") params.set("scope", "mine");
    if (order === "asc") params.set("order", "asc");

    router.push(`/?${params.toString()}`);
  };

  const toggleOrder = () => {
    const newOrder = order === "asc" ? "desc" : "asc";
    setOrder(newOrder);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-6 py-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Input
          placeholder="搜索关键字..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pr-9"
        />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {isLoggedIn && (
        <div className="flex items-center gap-1">
          <Button
            variant={scope === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("all")}
          >
            全部
          </Button>
          <Button
            variant={scope === "mine" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("mine")}
          >
            我的
          </Button>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={toggleOrder}
        title={order === "desc" ? "最新优先" : "最早优先"}
      >
        <ArrowUpDown className="mr-1 h-3 w-3" />
        {order === "desc" ? "最新" : "最早"}
      </Button>

      <Button size="sm" onClick={handleSearch}>
        <Search className="mr-1 h-3 w-3" />
        搜索
      </Button>
    </div>
  );
}
