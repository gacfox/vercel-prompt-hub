"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DrawingField {
  id: number;
  field_key: string;
  field_value: string;
}

interface DrawingDetailProps {
  model: string;
  prompt: string;
  fields: DrawingField[];
}

export function DrawingDetail({ model, prompt, fields }: DrawingDetailProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="border-b px-4 py-2">
          <h3 className="text-sm font-semibold">模型</h3>
        </div>
        <div className="p-4">
          <Badge variant="secondary">{model || "未指定"}</Badge>
        </div>
      </div>

      <CopyableSection title="提示词" content={prompt} />

      {fields.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-2">
            <h3 className="text-sm font-semibold">动态字段</h3>
          </div>
          <div className="divide-y">
            {fields.map((field) => (
              <div key={field.id} className="flex gap-4 px-4 py-3">
                <span className="shrink-0 text-sm font-medium text-muted-foreground min-w-[120px]">
                  {field.field_key}
                </span>
                <span className="text-sm break-all">{field.field_value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CopyableSection({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button variant="ghost" size="icon-xs" onClick={handleCopy}>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <pre className="overflow-auto p-4 text-sm whitespace-pre-wrap break-words">
        {content || "（空）"}
      </pre>
    </div>
  );
}
