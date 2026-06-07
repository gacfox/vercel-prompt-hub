"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetup = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "初始化失败");
        return;
      }

      // Redirect to register page after successful initialization
      router.push("/register");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Database className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">系统初始化</CardTitle>
          <CardDescription>
            首次使用需要初始化数据库，点击下方按钮开始
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p>初始化将创建以下数据表：</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>用户表</li>
              <li>内容主表</li>
              <li>文本、绘图、Agent Skill、Shell 详情表</li>
              <li>点赞表</li>
            </ul>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSetup}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                初始化中...
              </>
            ) : (
              "开始初始化"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
