"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface CommonFieldsProps {
  title: string;
  description: string;
  isPublic: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsPublicChange: (value: boolean) => void;
}

export function CommonFields({
  title,
  description,
  isPublic,
  onTitleChange,
  onDescriptionChange,
  onIsPublicChange,
}: CommonFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">内容名称 *</Label>
        <Input
          id="title"
          placeholder="请输入内容名称"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">内容简介</Label>
        <Textarea
          id="description"
          placeholder="请输入内容简介（可选）"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="isPublic"
          checked={isPublic}
          onCheckedChange={onIsPublicChange}
        />
        <Label htmlFor="isPublic">
          {isPublic ? "公开（所有人可见）" : "私有（仅自己可见）"}
        </Label>
      </div>
    </div>
  );
}
