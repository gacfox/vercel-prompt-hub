"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CommonFields } from "@/components/publish/common-fields";
import type { DrawingContent, DrawingField } from "@/lib/types";

interface DrawingFormProps {
  initialData?: {
    title: string;
    description: string;
    is_public: boolean;
    detail?: DrawingContent;
  };
  contentId?: number;
}

interface FieldEntry {
  field_key: string;
  field_value: string;
}

export function DrawingForm({ initialData, contentId }: DrawingFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? false);
  const [model, setModel] = useState(initialData?.detail?.model || "");
  const [prompt, setPrompt] = useState(initialData?.detail?.prompt || "");
  const [fields, setFields] = useState<FieldEntry[]>(
    initialData?.detail?.fields?.map((f: DrawingField) => ({
      field_key: f.field_key,
      field_value: f.field_value,
    })) || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addField = () => {
    setFields([...fields, { field_key: "", field_value: "" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: string) => {
    const updated = [...fields];
    if (key === "key") {
      updated[index].field_key = value.slice(0, 200);
    } else {
      updated[index].field_value = value;
    }
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("请输入内容名称");
      return;
    }

    setLoading(true);
    try {
      const url = contentId ? `/api/content/edit/${contentId}` : "/api/content/drawing";
      const method = contentId ? "PUT" : "POST";
      const body = contentId
        ? { title, description, is_public: isPublic, type: "drawing", model, prompt, fields }
        : { title, description, is_public: isPublic, model, prompt, fields };

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
        <Label htmlFor="model">模型名称</Label>
        <Input
          id="model"
          placeholder="请输入模型名称"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">提示词</Label>
        <Textarea
          id="prompt"
          placeholder="请输入提示词"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>动态字段</Label>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            添加字段
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="字段名（最多200字符）"
              value={field.field_key}
              onChange={(e) => updateField(index, "key", e.target.value)}
              maxLength={200}
              className="w-1/3"
            />
            <Input
              placeholder="字段值"
              value={field.field_value}
              onChange={(e) => updateField(index, "value", e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeField(index)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "提交中..." : contentId ? "保存修改" : "发布"}
      </Button>
    </form>
  );
}
