# Funsdata-doc-website

React 17 + TypeScript 单页应用，用于实时渲染存储在阿里云 OSS 上的 Markdown 帮助文档。

## 架构说明

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              整体架构                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │  📦 源码管理: GitHub (Funsdata/Funsdata-doc-website)                │      │
│  │     - React + TypeScript 前端代码                                   │      │
│  │     - 不包含任何文档内容                                             │      │
│  └───────────────────────────┬────────────────────────────────────────┘      │
│                              │ GitHub Actions 构建 & 部署                     │
│                              ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │  🌐 站点托管: 阿里云 OSS (funsdata-doc-website)                      │      │
│  │     - 静态网站托管模式                                               │      │
│  │     - CDN 加速（可选）                                               │      │
│  │     - 自定义域名 + HTTPS                                            │      │
│  └────────────────────────────────────────────────────────────────────┘      │
│                              ▲                                               │
│                              │ 请求文档/图片/视频                              │
│                              │                                               │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │  🚀 文档存储: 阿里云 OSS (funsdata-docs) + CDN                        │      │
│  │     - 全国加速                                                       │      │
│  │     - 无 rate limit                                                 │      │
│  │     - 支持大文件视频流媒体                                            │      │
│  └───────────────────────────┬────────────────────────────────────────┘      │
│                              ▲ GitHub Actions 自动同步                        │
│                              │                                               │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │  📚 文档管理: GitHub (Funsdata/FunsdataBI-doc)                       │      │
│  │     - Markdown 文档源文件                                           │      │
│  │     - 图片 (.png, .jpg, .gif, .webp)                               │      │
│  │     - 视频 (.mp4, .webm)                                           │      │
│  │     - 附件 (.zip, .pdf 等)                                         │      │
│  └────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
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
# 阿里云 CDN 基础 URL（文档内容 CDN）
VITE_DOCS_CDN_BASE_URL=https://docs-cdn.funsdata.com

# GitHub 仓库配置（用于构建时拉取文档目录）
VITE_DOCS_REPO_OWNER=Funsdata
VITE_DOCS_REPO_NAME=FunsdataBI-doc
VITE_DOCS_REPO_BRANCH=master

# 是否使用 jsDelivr CDN 代理 GitHub（开发环境可用，生产环境建议关闭）
VITE_DOCS_USE_JSDELIVR=false
```

## 内容加载优先级

文档内容按以下顺序获取（自动容错）：

1. **阿里云 CDN** - 生产环境推荐，配置 `VITE_DOCS_CDN_BASE_URL`
2. **jsDelivr CDN** - GitHub 的免费 CDN 代理（开发/备用）
3. **GitHub Raw** - 直接访问 GitHub，有 rate limit（最后备用）

## 文档中的资源引用

文档中的图片、视频等资源使用相对路径，前端会自动转换为 CDN 绝对路径：

```markdown
# 在 Markdown 中使用相对路径
![截图](./assets/screenshot.png)

<video src="./assets/demo.mp4" controls></video>

[下载附件](./files/data.zip)
```

---

## 阿里云 OSS 部署指南

本项目需要创建 **两个 OSS Bucket**：

| Bucket | 用途 | 示例名称 |
| --- | --- | --- |
| 站点 Bucket | 托管前端静态文件 | `funsdata-doc-website` |
| 文档 Bucket | 存储 Markdown、图片、视频 | `funsdata-docs` |

### 1. 创建站点 Bucket（前端静态托管）

#### 1.1 创建 Bucket

- **名称**：`funsdata-doc-website`
- **区域**：选择离用户近的区域（如 `cn-hangzhou`）
- **权限**：公共读
- **Endpoint**: oss-cn-beijing.aliyuncs.com

#### 1.2 开启静态网站托管

在 OSS 控制台 → Bucket → **基础设置** → **静态页面**：

```
默认首页: index.html
子目录首页: 关闭
默认 404 页: index.html   ← 重要！SPA 路由必须设置
```

> ⚠️ **关键配置**：将 404 页面设置为 `index.html`，否则 SPA 的客户端路由会返回 404。

#### 1.3 绑定自定义域名（可选）

1. 在 Bucket → **传输管理** → **绑定域名**
2. 添加域名如 `docs.funsdata.com`
3. 在域名 DNS 添加 CNAME 记录指向 OSS 域名
4. 上传 SSL 证书开启 HTTPS

### 2. 创建文档 Bucket（内容存储）

#### 2.1 创建 Bucket

- **名称**：`funsdata-doc`
- **区域**：与站点 Bucket 相同
- **权限**：公共读

#### 2.2 配置 CORS（跨域访问）

在 Bucket → **数据安全** → **跨域设置**，添加规则：

```
来源: https://docs.funsdata.com（你的站点域名）
允许 Methods: GET, HEAD
允许 Headers: *
暴露 Headers: ETag, Content-Length
缓存时间: 3600
```

#### 2.3 配置 CDN 加速（推荐）

1. 在阿里云 CDN 控制台添加域名
2. **源站信息**：选择 OSS 域名
3. **加速域名**：`docs-cdn.funsdata.com`
4. **缓存策略**：
   - `.md` 文件：1小时
   - 图片（`.png`, `.jpg`, `.gif`, `.webp`）：7天
   - 视频（`.mp4`, `.webm`）：30天
5. **开启 HTTPS**

---

## GitHub Actions 自动部署

### 配置 GitHub Secrets

两个仓库都需要配置以下 Secrets：

| Secret 名称 | 说明 |
| --- | --- |
| `ALIYUN_ACCESS_KEY_ID` | 阿里云 AccessKey ID |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云 AccessKey Secret |

> **获取 AccessKey**：[阿里云 RAM 控制台](https://ram.console.aliyun.com/) → AccessKey 管理
>
> **安全建议**：使用 RAM 子账户，仅授予 OSS 读写权限

---

### 站点自动部署（Funsdata-doc-website 仓库）

在 `Funsdata-doc-website` 仓库创建 `.github/workflows/deploy-to-oss.yml`：

```yaml
name: Build and Deploy to Aliyun OSS

on:
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_DOCS_CDN_BASE_URL: https://funsdata-doc.oss-cn-beijing.aliyuncs.com
          VITE_DOCS_REPO_OWNER: Funsdata
          VITE_DOCS_REPO_NAME: FunsdataBI-doc
          VITE_DOCS_REPO_BRANCH: master
          VITE_DOCS_USE_JSDELIVR: 'false'

      - name: Setup aliyun-cli
        uses: aliyun/setup-aliyun-cli-action@v1
        with:
          version: 'latest'

      - name: Configure aliyun-cli
        run: |
          aliyun configure set \
            --profile default \
            --mode AK \
            --region cn-beijing \
            --access-key-id ${{ secrets.ALIYUN_ACCESS_KEY_ID }} \
            --access-key-secret ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}

      - name: Deploy to OSS
        run: |
          # 同步构建产物到 OSS
          aliyun oss sync dist/ oss://funsdata-doc-website/ --delete

          echo "✅ Site deployed successfully!"
```

### 文档自动同步（FunsdataBI-doc 仓库）

在 `FunsdataBI-doc` 仓库创建 `.github/workflows/sync-to-oss.yml`：

```yaml
name: Sync Docs to Aliyun OSS

on:
  push:
    branches: [master]
  workflow_dispatch:  # 支持手动触发

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup aliyun-cli
        uses: aliyun/setup-aliyun-cli-action@v1
        with:
          version: 'latest'

      - name: Configure aliyun-cli
        run: |
          aliyun configure set \
            --profile default \
            --mode AK \
            --region cn-beijing \
            --access-key-id ${{ secrets.ALIYUN_ACCESS_KEY_ID }} \
            --access-key-secret ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}

      - name: Sync docs to OSS
        run: |
          # 同步所有文档和资源文件到 OSS
          aliyun oss sync . oss://funsdata-doc/ \
            --include "*.md" \
            --include "*.png" \
            --include "*.jpg" \
            --include "*.jpeg" \
            --include "*.gif" \
            --include "*.webp" \
            --include "*.mp4" \
            --include "*.webm" \
            --include "*.zip" \
            --include "*.pdf" \
            --delete

          echo "✅ Docs synced successfully!"

      - name: Trigger site rebuild
        run: |
          # 触发站点仓库重新构建（更新文档目录）
          curl -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
            https://api.github.com/repos/Funsdata/Funsdata-doc-website/dispatches \
            -d '{"event_type":"docs-updated"}'

          echo "✅ Site rebuild triggered!"
```

同时在 `Funsdata-doc-website` 的 workflow 中添加触发条件：

```yaml
on:
  push:
    branches: [main, master]
  repository_dispatch:
    types: [docs-updated]  # 接收文档仓库的触发
  workflow_dispatch:
```

---

## 完整工作流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         自动部署流程                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  文档更新流程:                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │ 推送文档到    │ -> │ GitHub      │ -> │ 同步到       │               │
│  │ FunsdataBI-  │    │ Actions     │    │ OSS 文档     │               │
│  │ doc 仓库     │    │ 自动触发     │    │ Bucket      │               │
│  └──────────────┘    └──────┬───────┘    └──────────────┘               │
│                             │                                           │
│                             ▼ 触发站点重建                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │ 站点仓库     │ -> │ 构建新的     │ -> │ 部署到       │               │
│  │ Actions     │    │ manifest     │    │ OSS 站点     │               │
│  │ 被触发      │    │ 目录索引     │    │ Bucket      │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│                                                                         │
│  站点代码更新流程:                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │ 推送代码到    │ -> │ GitHub      │ -> │ 部署到       │               │
│  │ doc-website │    │ Actions     │    │ OSS 站点     │               │
│  │ 仓库        │    │ 构建部署     │    │ Bucket      │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 扩展计划

- 🔍 **搜索**：当前使用 Fuse.js，未来可挂接 Algolia / Meilisearch
- 📚 **目录排序**：可在 Markdown frontmatter 中添加 `sidebar_position`
- 🎨 **主题**：支持暗色模式
