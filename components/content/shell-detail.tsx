"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ShellDetailProps {
  shellType: string;
  command: string;
}

const shellLabels: Record<string, string> = {
  cmd: "CMD",
  powershell: "PowerShell",
  bash: "Bash",
};

export function ShellDetail({ shellType, command }: ShellDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">类型：</span>
        <Badge variant="secondary">{shellLabels[shellType] || shellType}</Badge>
      </div>

      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="text-sm font-semibold">命令</h3>
          <Button variant="ghost" size="icon-xs" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <pre className="overflow-auto bg-muted/50 p-4 text-sm font-mono whitespace-pre-wrap break-words">
          {command || "（空）"}
        </pre>
      </div>
    </div>
  );
}
