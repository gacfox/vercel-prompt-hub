"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, File, Folder, FolderOpen, FolderPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommonFields } from "@/components/publish/common-fields";
import type { AgentSkillContent } from "@/lib/types";
import { cn } from "@/lib/utils";

// --- Tree building logic (shared with detail view) ---

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  content?: string;
}

function buildTree(files: FileEntry[]): TreeNode[] {
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

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));
  };

  return sortNodes(root);
}

// --- Tree node component ---

function TreeNodeView({
  node,
  selectedPath,
  onSelect,
  onAddFile,
  onAddFolder,
  depth,
}: {
  node: TreeNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onAddFile: (basePath: string) => void;
  onAddFolder: (basePath: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedPath === node.path;
  const [menuOpen, setMenuOpen] = useState(false);

  if (node.isDirectory) {
    return (
      <div>
        <div
          className={cn(
            "group flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-accent",
            isSelected ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={(e) => {
            // Only toggle when clicking the row itself, not child buttons
            if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.min-w-0')) {
              onSelect(node.path);
              setExpanded(!expanded);
            }
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {expanded ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "shrink-0 rounded p-0.5 hover:bg-accent/80",
                  menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[120px]">
              <DropdownMenuItem onClick={() => onAddFile(node.path)}>
                <File className="mr-2 h-3.5 w-3.5" />
                添加文件
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddFolder(node.path)}>
                <FolderPlus className="mr-2 h-3.5 w-3.5" />
                添加文件夹
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {expanded &&
          node.children.map((child) => (
            <TreeNodeView
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              depth={depth + 1}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-accent",
        isSelected && "bg-accent text-accent-foreground"
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onSelect(node.path)}
    >
      <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

// --- Main form ---

interface AgentSkillFormProps {
  initialData?: {
    title: string;
    description: string;
    is_public: boolean;
    detail?: AgentSkillContent;
  };
  contentId?: number;
}

interface FileEntry {
  file_path: string;
  content: string;
  is_directory: boolean;
}

export function AgentSkillForm({ initialData, contentId }: AgentSkillFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? false);
  const [files, setFiles] = useState<FileEntry[]>(
    initialData?.detail?.files?.map((f) => ({
      file_path: f.file_path,
      content: f.content,
      is_directory: f.is_directory,
    })) || []
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dialog states
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [pendingBasePath, setPendingBasePath] = useState("");

  const selectedFile = files.find((f) => f.file_path === selectedPath);

  // Build the tree for rendering
  const tree = buildTree(files);

  const resolveBasePath = () => {
    if (selectedPath && files.find((f) => f.file_path === selectedPath)?.is_directory) {
      return selectedPath;
    }
    return "";
  };

  // Called from toolbar buttons
  const openFileDialog = () => {
    setPendingBasePath(resolveBasePath());
    setNewName("");
    setNameError("");
    setFileDialogOpen(true);
  };

  const openFolderDialog = () => {
    setPendingBasePath(resolveBasePath());
    setNewName("");
    setNameError("");
    setFolderDialogOpen(true);
  };

  // Called from tree folder "+" dropdown
  const openFileDialogFor = (basePath: string) => {
    setPendingBasePath(basePath);
    setNewName("");
    setNameError("");
    setFileDialogOpen(true);
  };

  const openFolderDialogFor = (basePath: string) => {
    setPendingBasePath(basePath);
    setNewName("");
    setNameError("");
    setFolderDialogOpen(true);
  };

  const confirmAddFile = () => {
    if (!newName.trim()) {
      setNameError("请输入文件名");
      return;
    }
    const fullPath = pendingBasePath ? `${pendingBasePath}/${newName.trim()}` : newName.trim();

    if (files.some((f) => f.file_path === fullPath)) {
      setNameError("文件已存在");
      return;
    }

    setFiles([...files, { file_path: fullPath, content: "", is_directory: false }]);
    setNewName("");
    setNameError("");
    setFileDialogOpen(false);
    setSelectedPath(fullPath);
  };

  const confirmAddFolder = () => {
    if (!newName.trim()) {
      setNameError("请输入文件夹名");
      return;
    }
    const fullPath = pendingBasePath ? `${pendingBasePath}/${newName.trim()}` : newName.trim();

    if (files.some((f) => f.file_path === fullPath)) {
      setNameError("文件夹已存在");
      return;
    }

    setFiles([...files, { file_path: fullPath, content: "", is_directory: true }]);
    setNewName("");
    setNameError("");
    setFolderDialogOpen(false);
    setSelectedPath(fullPath);
  };

  const removeEntry = () => {
    if (!selectedPath) return;
    const path = selectedPath;
    setFiles(files.filter((f) => !f.file_path.startsWith(path)));
    setSelectedPath(null);
  };

  const updateFileContent = (content: string) => {
    if (!selectedPath) return;
    setFiles(
      files.map((f) =>
        f.file_path === selectedPath ? { ...f, content } : f
      )
    );
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
      const url = contentId ? `/api/content/edit/${contentId}` : "/api/content/agent-skill";
      const method = contentId ? "PUT" : "POST";
      const body = contentId
        ? { title, description, is_public: isPublic, type: "agent_skill", files }
        : { title, description, is_public: isPublic, files };

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

      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <Label>文件结构</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              添加文件
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFolderDialog}
            >
              <FolderPlus className="mr-1 h-3.5 w-3.5" />
              添加文件夹
            </Button>
            {selectedPath && (
              <Button type="button" variant="ghost" size="sm" onClick={removeEntry} className="text-destructive">
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                删除
              </Button>
            )}
          </div>
        </div>

        <div className="flex h-[400px]">
          {/* File tree */}
          <div className="w-64 shrink-0 border-r p-2 overflow-auto">
            {tree.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">请添加文件或文件夹</p>
            )}
            {tree.map((node) => (
              <TreeNodeView
                key={node.path}
                node={node}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
                onAddFile={openFileDialogFor}
                onAddFolder={openFolderDialogFor}
                depth={0}
              />
            ))}
          </div>

          {/* File content editor */}
          <div className="flex-1 p-2">
            {selectedFile && !selectedFile.is_directory ? (
              <Textarea
                value={selectedFile.content}
                onChange={(e) => updateFileContent(e.target.value)}
                className="h-full resize-none font-mono text-sm"
                placeholder="请输入文件内容"
              />
            ) : selectedFile?.is_directory ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                已选择文件夹
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                选择文件以编辑内容
              </div>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "提交中..." : contentId ? "保存修改" : "发布"}
      </Button>

      {/* 添加文件对话框 */}
      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>添加文件</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {pendingBasePath && (
              <p className="text-sm text-muted-foreground">
                将添加到：<span className="font-medium text-foreground">{pendingBasePath}/</span>
              </p>
            )}
            <Input
              placeholder="请输入文件名"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNameError(""); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), confirmAddFile())}
              autoFocus
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFileDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={confirmAddFile}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加文件夹对话框 */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>添加文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {pendingBasePath && (
              <p className="text-sm text-muted-foreground">
                将添加到：<span className="font-medium text-foreground">{pendingBasePath}/</span>
              </p>
            )}
            <Input
              placeholder="请输入文件夹名"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNameError(""); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), confirmAddFolder())}
              autoFocus
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFolderDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={confirmAddFolder}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
