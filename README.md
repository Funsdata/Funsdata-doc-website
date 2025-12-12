# Funsdata-doc-website

React 17 + TypeScript 单页应用，用来实时渲染存储在 GitHub（或 CDN）上的 Markdown 帮助文档。项目结构拆分为：

```
docs/      # 原始 Markdown（多语言 / 多版本）
website/   # React 前端（Tailwind + markdown-it）
```

## 快速开始

```bash
cd website
cp .env.example .env.local   # 根据仓库信息修改
npm install
npm run dev
```

`npm run dev` / `npm run build` 会自动执行 `npm run docs:manifest`，读取 `../docs` 生成目录树、搜索索引及 `public/raw/` 回退资源。

| Script | 说明 |
| --- | --- |
| `npm run docs:manifest` | 将 Markdown 解析为 `public/manifest/*.json` + 本地 Raw 拷贝 |
| `npm run dev` | 开发模式（含预处理） |
| `npm run build` | 生产构建（含预处理、TypeScript 检查） |
| `npm run preview` | 预览生产包 |
| `npm run lint` | ESLint |

## 配置 CDN / GitHub RAW

- 在 `docs/versions.config.json` 中为不同语言指定 `cdnBaseUrl`，或在 `.env.local` 中填入 `VITE_DOCS_CDN_BASE_URL`。
- 未命中 CDN 时会回退到 `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/docs/...`。
- 本地开发默认兜底到 `public/raw/<locale>/<version>/...`，无需联网即可预览。

## TODO & 扩展

- 🔍 搜索：当前使用 Fuse.js，未来可挂接 Algolia / Meilisearch。
- 📚 目录排序：目前为字母序，可在 Markdown frontmatter 中添加 `sidebar_position` 后扩展脚本。
- 🚀 部署：建议在 CI（GitHub Actions）中运行 `npm run docs:manifest && npm run build`，将 `public/manifest` 与静态站点一同发布。

---

## （以下为 Vite 原始说明，仅供参考）

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    *** End Patch
    extends: [
