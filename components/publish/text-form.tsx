"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CommonFields } from "@/components/publish/common-fields";
import type { TextContent } from "@/lib/types";

interface TextFormProps {
  initialData?: {
    title: string;
    description: string;
    is_public: boolean;
    detail?: TextContent;
  };
  contentId?: number;
}

export function TextForm({ initialData, contentId }: TextFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? false);
  const [systemPrompt, setSystemPrompt] = useState(initialData?.detail?.system_prompt || "");
  const [userPrompt, setUserPrompt] = useState(initialData?.detail?.user_prompt || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("请输入内容名称");
      return;
    }

    setLoading(true);
    try {
      const url = contentId ? `/api/content/edit/${contentId}` : "/api/content/text";
      const method = contentId ? "PUT" : "POST";
      const body = contentId
        ? { title, description, is_public: isPublic, type: "text", system_prompt: systemPrompt, user_prompt: userPrompt }
        : { title, description, is_public: isPublic, system_prompt: systemPrompt, user_prompt: userPrompt };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "发布失败");
        return;
      }

      router.push(contentId ? `/content/${contentId}` : `/content/${data.data.id}`);
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <CommonFields
        title={title}
        description={description}
        isPublic={isPublic}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onIsPublicChange={setIsPublic}
      />

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System 提示词</Label>
        <Textarea
          id="systemPrompt"
          placeholder="请输入 System 提示词"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userPrompt">User 提示词</Label>
        <Textarea
          id="userPrompt"
          placeholder="请输入 User 提示词"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={6}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "提交中..." : contentId ? "保存修改" : "发布"}
      </Button>
    </form>
  );
}
