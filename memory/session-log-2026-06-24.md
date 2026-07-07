# Session Log 2026-06-24

## ClaudeCode:

### 修复 Vercel 站点 500 错误
- **原因**：`package.json` prebuild 中新增了 `generate:og-image`，该脚本尝试启动无头浏览器，Vercel 构建环境无浏览器导致构建卡死/超时
- **修复**：`9c97242` 将 prebuild 从 `generate:sitemap && generate:rss && generate:og-image` 改为 `generate:sitemap && generate:rss`
- **接续点**：已解决

### 移除 Publisher 令牌验证
- **修改文件**：`scripts/local-publisher-server.mjs`
- **内容**：移除 `LOCAL_PUBLISHER_TOKEN` 检查、令牌输入框、localStorage 存储、API header 发送
- **提交**：`15c41eb`
- **接续点**：已解决

### 修复 Publisher 验证错误提示
- **问题**：发布失败时只显示 "Validation failed"，不显示具体文件/原因
- **修复**：
  - `5017278`：API 返回的 error body 中附加 validations 数据，client 端解析显示
  - `0fe198c`：服务器端将验证错误写入 state.lastLogs，避免 5 秒刷新覆盖
- **接续点**：已解决

### 添加错误详情页面
- **修改文件**：`src/routes/__root.tsx`
- **内容**：ErrorComponent 中增加 `<details>` 折叠面板显示 error.message 和 error.stack
- **提交**：`59d8205`
- **接续点**：已部署

### 修复 discovery.json / sitemap.xml URL
- **内容**：提交 `public/discovery.json`、`public/sitemap.xml`、`public/robots.txt`，URL 从 localhost:3000 改为 hookoon.xyz
- **新增**：`public/rss.xml`、`public/images/og-default.png`、`scripts/generate-rss.mjs`、`scripts/generate-og-image.mjs`、`scripts/og-image-template.html`
- **提交**：`b8c9ac1`
- **接续点**：已解决

### 已知遗留
- `/projects/ai-agent-workflow-lab` 因唯一文章被软撤稿而返回 404
- Vercel 构建队列曾因 `generate:og-image` 卡死，用户在 Dashboard 手动清理后恢复
