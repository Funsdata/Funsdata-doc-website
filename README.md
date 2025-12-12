# Funsdata-doc-website

React 17 + TypeScript 单页应用，用于实时渲染存储在阿里云 CDN / GitHub 上的 Markdown 帮助文档。

## 架构说明

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              整体架构                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📦 源码管理: GitHub (Funsdata/Funsdata-doc-website)                │   │
│  │     - React + TypeScript 前端代码                                   │   │
│  │     - 不包含任何文档内容                                             │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │ 部署                                      │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🌐 文档站点: Vercel / Netlify / 阿里云                              │   │
│  │     - 纯静态前端站点                                                 │   │
│  │     - 从 CDN 动态加载文档内容                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                 ▲                                           │
│                                 │ 请求文档/图片/视频                        │
│                                 │                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🚀 内容分发: 阿里云 CDN / jsDelivr                                  │   │
│  │     - 全国/全球加速                                                  │   │
│  │     - 无 rate limit                                                  │   │
│  │     - 支持大文件视频流媒体                                           │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 ▲                                           │
│                                 │                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📚 文档管理: GitHub (Funsdata/FunsdataBI-doc)                       │   │
│  │     - Markdown 文档源文件                                            │   │
│  │     - 图片 (.png, .jpg, .gif, .webp)                                │   │
│  │     - 视频 (.mp4, .webm)                                            │   │
│  │     - 附件 (.zip, .pdf 等)                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 快速开始

```bash
# 1. 复制环境变量配置
cp .env.example .env.local

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

## 脚本说明

| Script | 说明 |
| --- | --- |
| `npm run docs:manifest` | 从 GitHub 拉取文档，生成 `public/manifest/*.json` 目录索引 |
| `npm run dev` | 开发模式（自动执行 manifest 生成） |
| `npm run build` | 生产构建（自动执行 manifest 生成 + TypeScript 检查） |
| `npm run preview` | 预览生产包 |
| `npm run lint` | ESLint |

## 环境变量配置

在 `.env.local` 中配置以下变量：

```bash
# 阿里云 CDN 基础 URL（推荐生产环境使用）
VITE_DOCS_CDN_BASE_URL=https://docs-cdn.funsdata.com

# GitHub 仓库配置（用于 jsDelivr CDN 或直接访问）
VITE_DOCS_REPO_OWNER=Funsdata
VITE_DOCS_REPO_NAME=FunsdataBI-doc
VITE_DOCS_REPO_BRANCH=master

# 是否使用 jsDelivr CDN 代理 GitHub（推荐开启，无 rate limit）
VITE_DOCS_USE_JSDELIVR=true
```

## 内容加载优先级

文档内容按以下顺序获取（自动容错）：

1. **阿里云 CDN** - 如配置 `VITE_DOCS_CDN_BASE_URL`
2. **jsDelivr CDN** - GitHub 的免费 CDN 代理，无 rate limit
3. **GitHub Raw** - 直接访问 GitHub，有 rate limit（备用）

## 文档中的资源引用

文档中的图片、视频等资源使用相对路径，前端会自动转换为 CDN 绝对路径：

```markdown
# 在 Markdown 中使用相对路径
![截图](./assets/screenshot.png)

<video src="./assets/demo.mp4" controls></video>

[下载附件](./files/data.zip)
```

## 部署

### 方式一：Vercel / Netlify（推荐）

直接连接 GitHub 仓库，自动构建部署。

### 方式二：阿里云 OSS + CDN

```bash
# 构建
npm run build

# 上传 dist/ 目录到 OSS
aliyun oss sync dist/ oss://your-bucket/
```

## 阿里云配置指南

### 1. 创建 OSS Bucket（文档内容）

- **用途**：存储文档 Markdown、图片、视频
- **区域**：选择离用户近的区域
- **权限**：公共读
- **CORS**：允许文档站点域名

### 2. 配置 CDN 加速

- **源站**：OSS Bucket
- **域名**：`docs-cdn.funsdata.com`
- **缓存策略**：
  - `.md` 文件：1小时
  - 图片：7天
  - 视频：30天
- **开启 HTTPS**

### 3. GitHub Actions 自动同步（可选）

在文档仓库 `FunsdataBI-doc` 中配置：

```yaml
# .github/workflows/sync-to-oss.yml
name: Sync Docs to Aliyun OSS

on:
  push:
    branches: [master]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Sync to OSS
        uses: aliyun/setup-aliyun-cli-action@v1
        with:
          aliyun-cli-version: '3.0.184'

      - run: |
          aliyun oss sync . oss://funsdata-docs/ \
            --include "*.md" --include "*.png" --include "*.jpg" \
            --include "*.gif" --include "*.mp4" --include "*.webm" \
            --include "*.zip" --include "*.pdf"
```

## 扩展计划

- 🔍 **搜索**：当前使用 Fuse.js，未来可挂接 Algolia / Meilisearch
- 📚 **目录排序**：可在 Markdown frontmatter 中添加 `sidebar_position`
- 🎨 **主题**：支持暗色模式
