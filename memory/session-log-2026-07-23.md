# Session Log 2026-07-23

## ClaudeCode:

### 12:46 HKT - 博客 favicon 配置

- 将 `public/hookoon-favicon-kit/hookoon-favicon-kit/` 中的 7 个 favicon 文件复制到 `public/`
- 在 `src/routes/__root.tsx` 的 `head()` links 数组添加 3 条 favicon link 标签：
  - `/favicon.svg` (SVG, 现代浏览器)
  - `/favicon.ico` (ICO, 兼容备选)
  - `/apple-touch-icon.png` (iOS Safari)
- TypeScript typecheck 通过，无错误
- 本地 build 因 `VITE_SITE_URL` 未设而失败，属已有问题，与本次改动无关
