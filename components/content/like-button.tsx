"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  contentId: number;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({
  contentId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/likes/${contentId}`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setLiked(data.data.liked);
        setCount(data.data.count);
      }
    } catch (error) {
      console.error("[vph] Like toggle error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1", liked && "text-red-500 hover:text-red-600")}
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      <span className="text-sm">{count}</span>
    </Button>
  );
}
