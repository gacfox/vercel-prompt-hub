"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ContentCard } from "@/components/content/content-card";
import { ContentCardSkeleton } from "@/components/content/content-card-skeleton";
import type { ContentType, ContentListItem } from "@/lib/types";

interface ContentListProps {
  initialItems: ContentListItem[];
  initialNextCursor: string | null;
  type: ContentType | "all";
  keyword: string;
  scope: "all" | "mine";
  order: "asc" | "desc";
}

export function ContentList({
  initialItems,
  initialNextCursor,
  type,
  keyword,
  scope,
  order,
}: ContentListProps) {
  const [items, setItems] = useState<ContentListItem[]>(
    Array.isArray(initialItems) ? initialItems : []
  );
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !nextCursor) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("cursor", nextCursor);
      params.set("limit", "20");
      if (type !== "all") params.set("type", type);
      if (keyword) params.set("keyword", keyword);
      if (scope === "mine") params.set("scope", "mine");
      params.set("order", order);

      const res = await fetch(`/api/content?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const newItems = Array.isArray(data.data?.items) ? data.data.items : [];
        setItems((prev) => [...prev, ...newItems]);
        setNextCursor(data.data?.nextCursor ?? null);
      }
    } catch (error) {
      console.error("[vph] Load more error:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, nextCursor, type, keyword, scope, order]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loading, loadMore]);

  // Reset when filters change
  useEffect(() => {
    setItems(initialItems);
    setNextCursor(initialNextCursor);
  }, [initialItems, initialNextCursor]);

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">暂无内容</p>
        <p className="text-sm">成为第一个发布内容的人吧！</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>

      {loading && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
