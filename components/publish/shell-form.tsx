"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommonFields } from "@/components/publish/common-fields";
import type { ShellContent } from "@/lib/types";

interface ShellFormProps {
  initialData?: {
    title: string;
    description: string;
    is_public: boolean;
    detail?: ShellContent;
  };
  contentId?: number;
}

export function ShellForm({ initialData, contentId }: ShellFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? false);
  const [shellType, setShellType] = useState<string>(initialData?.detail?.shell_type || "bash");
  const [command, setCommand] = useState(initialData?.detail?.command || "");
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
      const url = contentId ? `/api/content/edit/${contentId}` : "/api/content/shell";
      const method = contentId ? "PUT" : "POST";
      const body = contentId
        ? { title, description, is_public: isPublic, type: "shell", shell_type: shellType, command }
        : { title, description, is_public: isPublic, shell_type: shellType, command };

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
        <Label>类型 *</Label>
        <Select value={shellType} onValueChange={setShellType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bash">Bash</SelectItem>
            <SelectItem value="powershell">PowerShell</SelectItem>
            <SelectItem value="cmd">CMD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="command">命令</Label>
        <Textarea
          id="command"
          placeholder="请输入命令"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          rows={6}
          className="font-mono"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "提交中..." : contentId ? "保存修改" : "发布"}
      </Button>
    </form>
  );
}
