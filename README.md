# Prompt Hub

AI Prompt 分享与管理平台，支持文本提示词、绘图提示词、Agent Skills、Shell 命令四种内容类型的发布、浏览与管理。

## 功能

- **内容管理** — 支持文本、绘图、Agent Skills、Shell 命令四种类型
- **用户系统** — 注册、登录、个人信息管理
- **权限控制** — 公开/私有内容，编辑删除仅限作者
- **主题切换** — 系统/亮色/暗色模式
- **响应式布局** — 适配桌面端和移动端
- **无限滚动** — 游标分页，流式加载

## 技术栈

- **框架** — Next.js 16 (App Router, Edge Runtime)
- **UI** — shadcn/ui + Tailwind CSS v4
- **数据库** — Neon PostgreSQL (Serverless)
- **缓存/会话** — Upstash Redis
- **配置** — Vercel Edge Config

## 环境变量

在 `.env.local` 中配置以下变量：

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token |
| `EDGE_CONFIG` | Vercel Edge Config 连接地址 |

## 本地开发

```bash
npm install
npm run dev
```

首次访问会跳转到初始化页面，点击按钮自动创建数据表。

## 注册控制

通过 Edge Config 的 `vph-allow-register` 项控制是否开放注册。

## 部署

推送到 GitHub 后通过 Vercel 自动部署，需在 Vercel 项目中创建以下 Storage：

1. **Neon PostgreSQL** — 数据库
2. **Upstash Redis** — 会话存储
3. **Edge Config** — 配置管理

## 许可证

MIT
