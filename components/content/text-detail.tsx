"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TextDetailProps {
  systemPrompt: string;
  userPrompt: string;
}

export function TextDetail({ systemPrompt, userPrompt }: TextDetailProps) {
  return (
    <div className="space-y-4">
      <PromptSection title="System Prompt" content={systemPrompt} />
      <PromptSection title="User Prompt" content={userPrompt} />
    </div>
  );
}

function PromptSection({ title, content }: { title: string; content: string }) {
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
