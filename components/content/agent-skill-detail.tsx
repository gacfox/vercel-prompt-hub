"use client";

import { useState } from "react";
import { File, Folder, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AgentSkillFile {
  id: number;
  file_path: string;
  content: string;
  is_directory: boolean;
}

interface AgentSkillDetailProps {
  files: AgentSkillFile[];
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  content?: string;
}

function buildTree(files: AgentSkillFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.file_path.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existingNode = current.find((n) => n.name === part);

      if (existingNode) {
        current = existingNode.children;
      } else {
        const newNode: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDirectory: !isLast || file.is_directory,
          children: [],
          content: isLast && !file.is_directory ? file.content : undefined,
        };
        current.push(newNode);
        current = newNode.children;
      }
    }
  }

  // Sort: directories first, then files, alphabetical within each group
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map((node) => ({
      ...node,
      children: sortNodes(node.children),
    }));
  };

  return sortNodes(root);
}

export function AgentSkillDetail({ files }: AgentSkillDetailProps) {
  const tree = buildTree(files);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Find content for selected file
  const selectedFile = files.find((f) => f.file_path === selectedPath);

  return (
    <div className="flex gap-4 rounded-lg border h-[500px]">
      {/* File tree */}
      <div className="w-64 shrink-0 border-r">
        <div className="border-b px-3 py-2">
          <h3 className="text-sm font-semibold">文件</h3>
        </div>
        <ScrollArea className="h-[calc(500px-37px)]">
          <div className="p-2">
            {tree.map((node) => (
              <TreeNodeView
                key={node.path}
                node={node}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
                depth={0}
              />
            ))}
            {tree.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">暂无文件</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* File content */}
      <div className="flex-1 overflow-hidden">
        <div className="border-b px-3 py-2">
          <h3 className="text-sm font-semibold">
            {selectedPath || "选择文件查看内容"}
          </h3>
        </div>
        <ScrollArea className="h-[calc(500px-37px)]">
          <pre className="p-4 text-sm whitespace-pre-wrap break-words font-mono">
            {selectedFile ? selectedFile.content || "（空文件）" : "点击左侧文件查看内容"}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}

interface TreeNodeViewProps {
  node: TreeNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth: number;
}

function TreeNodeView({ node, selectedPath, onSelect, depth }: TreeNodeViewProps) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedPath === node.path;

  if (node.isDirectory) {
    return (
      <div>
        <button
          className={cn(
            "flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-accent",
            "text-muted-foreground"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {expanded &&
          node.children.map((child) => (
            <TreeNodeView
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-accent",
        isSelected && "bg-accent text-accent-foreground"
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onSelect(node.path)}
    >
      <File className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
