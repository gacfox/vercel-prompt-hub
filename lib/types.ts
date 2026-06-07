// Content type enum
export type ContentType = "text" | "drawing" | "agent_skill" | "shell";

// User
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Session data stored in Redis
export interface SessionData {
  userId: number;
  username: string;
  email: string;
}

// Unified content
export interface Content {
  id: number;
  author_id: number;
  type: ContentType;
  title: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Content list item (with author info for display)
export interface ContentListItem {
  id: number;
  type: ContentType;
  title: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_email: string;
  like_count: number;
}

// Text content detail
export interface TextContent {
  id: number;
  content_id: number;
  system_prompt: string;
  user_prompt: string;
}

// Drawing content detail
export interface DrawingContent {
  id: number;
  content_id: number;
  model: string;
  prompt: string;
  fields: DrawingField[];
}

export interface DrawingField {
  id: number;
  drawing_id: number;
  field_key: string;
  field_value: string;
}

// Agent skill detail
export interface AgentSkillContent {
  id: number;
  content_id: number;
  files: AgentSkillFile[];
}

export interface AgentSkillFile {
  id: number;
  agent_skill_id: number;
  file_path: string;
  content: string;
  is_directory: boolean;
}

// Shell content detail
export interface ShellContent {
  id: number;
  content_id: number;
  shell_type: "cmd" | "powershell" | "bash";
  command: string;
}

// Like
export interface Like {
  id: number;
  user_id: number;
  content_id: number;
  created_at: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

// Content detail (full, for detail page)
export interface ContentDetail {
  content: Content;
  author_name: string;
  author_email: string;
  like_count: number;
  liked_by_me: boolean;
  detail: TextContent | DrawingContent | AgentSkillContent | ShellContent;
}

// API response helpers
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Filter params
export interface ContentFilter {
  type?: ContentType | "all";
  keyword?: string;
  scope: "all" | "mine";
  order: "asc" | "desc";
  cursor?: string;
  limit?: number;
}

// Publish form data types
export interface TextPublishData {
  title: string;
  description: string;
  is_public: boolean;
  system_prompt: string;
  user_prompt: string;
}

export interface DrawingPublishData {
  title: string;
  description: string;
  is_public: boolean;
  model: string;
  prompt: string;
  fields: { field_key: string; field_value: string }[];
}

export interface AgentSkillPublishData {
  title: string;
  description: string;
  is_public: boolean;
  files: { file_path: string; content: string; is_directory: boolean }[];
}

export interface ShellPublishData {
  title: string;
  description: string;
  is_public: boolean;
  shell_type: "cmd" | "powershell" | "bash";
  command: string;
}
