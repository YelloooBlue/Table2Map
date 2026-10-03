# Table2Map

> 将飞书多维表格中的团队地点，变成可搜索、可筛选、可分享的交互地图。

Table2Map 是一个移动端优先的 POI（兴趣点）浏览应用。团队在飞书多维表格中维护地点信息，应用在服务端读取已发布的数据，并以地图与列表联动的方式呈现；无需额外维护一套内容后台。

## 目录

- [Table2Map](#table2map)
  - [目录](#目录)
  - [功能](#功能)
  - [技术架构](#技术架构)
  - [快速开始](#快速开始)
    - [前置条件](#前置条件)
    - [安装与运行](#安装与运行)
  - [环境变量与 Key 获取](#环境变量与-key-获取)
    - [1. 创建并配置飞书自建应用](#1-创建并配置飞书自建应用)
    - [2. 获取多维表格 App Token 与 Table ID](#2-获取多维表格-app-token-与-table-id)
    - [3. 申请天地图 Key](#3-申请天地图-key)
  - [飞书数据结构](#飞书数据结构)
  - [部署](#部署)
    - [Vercel](#vercel)
  - [开发](#开发)
  - [项目结构](#项目结构)
  - [贡献](#贡献)
  - [许可证](#许可证)

## 功能

- **飞书作为唯一数据源**：仅展示状态为“已发布”的多维表格记录。
- **地图与列表联动**：点击地点卡片或地图标记，会同步高亮、定位并打开详情。
- **快速发现地点**：支持按名称搜索，并按地点类型、城市筛选。
- **地点详情与图片**：展示类型、评分、位置、推荐理由和飞书附件图片；支持图片预览。
- **可分享的地点链接**：通过 `?poi=<记录 ID>` 直接打开并聚焦某个地点。
- **坐标适配**：集中处理飞书位置字段的 GCJ-02 坐标与天地图底图间的转换。
- **凭据不下发到浏览器**：飞书访问令牌、表格读取与附件下载均由服务端代理完成。

## 技术架构

```mermaid
flowchart LR
  F[飞书多维表格] -->|服务端 API| N[Next.js / Vercel]
  N -->|标准化后的 POI 数据| B[浏览器]
  N -->|受控图片响应| B
  B -->|地图瓦片请求| T[天地图]
```

| 层级     | 方案                                  |
| -------- | ------------------------------------- |
| 内容维护 | 飞书多维表格                          |
| 应用框架 | Next.js App Router、React、TypeScript |
| 地图     | Leaflet + 天地图 WMTS 瓦片            |
| 样式     | Tailwind CSS                          |
| 托管     | Vercel                                |

## 快速开始

### 前置条件

- Node.js 22+
- pnpm 10+
- 一个具有读取权限的飞书自建应用和多维表格
- 天地图浏览器端 Key

### 安装与运行

```bash
pnpm install
cp .env.example .env.local
```

按照下一节填入 `.env.local` 后，启动开发服务器：

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。局域网移动设备调试请运行 `pnpm dev:lan`，再访问 `http://<本机名称>.local:3000`；macOS 可通过 `scutil --get LocalHostName` 查询本机名称。

## 环境变量与 Key 获取

将下列变量写入 `.env.local`；部署时在 Vercel 的 **Settings → Environment Variables** 中配置同名变量。

| 变量                            | 获取位置                                     | 可见性     |
| ------------------------------- | -------------------------------------------- | ---------- |
| `FEISHU_APP_ID`                 | 飞书开放平台 → 自建应用 → **凭证与基础信息** 注意给应用添加读取多维表格的权限，或按照直接启动后log中的提示进行配置 | 服务端私密 |
| `FEISHU_APP_SECRET`             | 与 App ID 相同页面，复制或重置 App Secret    | 服务端私密 |
| `FEISHU_BITABLE_APP_TOKEN`      | 多维表格 URL 中 `base/<APP_TOKEN>` 或 `wiki/<APP_TOKEN>` 部分              | 服务端私密 |
| `FEISHU_BITABLE_TABLE_ID`       | 多维表格 URL 查询参数中的 `table=<TABLE_ID>` 标识，一般以 `tbl` 开头      | 服务端私密 |
| `NEXT_PUBLIC_TIANDITU_TILE_KEY` | 天地图开发者控制台的浏览器端应用 Key，生产环境建议配置白名单         | **浏览器公开** |

```dotenv
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_BITABLE_APP_TOKEN=
FEISHU_BITABLE_TABLE_ID=
NEXT_PUBLIC_TIANDITU_TILE_KEY=
```

### 1. 创建并配置飞书自建应用

1. 打开[飞书开放平台开发者后台](https://open.feishu.cn/app?lang=zh-CN)，创建企业自建应用。
2. 进入应用的**凭证与基础信息**，复制 `App ID` 与 `App Secret`，分别填入 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`。应用通过这两个凭证换取服务端 `tenant_access_token`。
3. 在**权限管理**中申请读取多维表格记录的权限，以及读取/下载云空间附件的权限；本项目会读取记录并下载图片附件。以[查询多维表格记录 API](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list)与实际租户的权限提示为准。
4. 创建应用版本、发布并在目标租户启用。若表格设有额外访问限制，也需要确保该应用可以访问该多维表格。

### 2. 获取多维表格 App Token 与 Table ID

在浏览器中打开目标多维表格，地址通常类似：

```text
https://<tenant>.feishu.cn/base/xxxxxx?table=tblxxx&view=vewxxx
https://my.feishu.cn/wiki/xxxxxx?table=tblxxx&view=vewxxx # 个人版飞书
```

- 路径中 `base/` 或 `wiki/` 后的 `xxxxxx` 是 **App Token**，填入 `FEISHU_BITABLE_APP_TOKEN`。
- `table=` 后的 `tbl...` 是 **Table ID**，填入 `FEISHU_BITABLE_TABLE_ID`。

不要使用链接里的 `view` 值。若使用的是不同的飞书 URL 样式，请以对应 Base 与表格标识为准。字段名需与下一节的约定一致，或修改 [`src/lib/poi.ts`](src/lib/poi.ts) 中的映射。

### 3. 申请天地图 Key

1. 前往[天地图开发资源平台](https://lbs.tianditu.gov.cn/)，注册并完成开发者认证。
2. 进入控制台的**应用管理**，创建新应用，应用类型选择**浏览器端**。
3. 在该应用中设置正式 Vercel 域名和自定义域名的白名单，复制生成的 `tk`（Key）到 `NEXT_PUBLIC_TIANDITU_TILE_KEY`。

这个 Key 会随前端代码发送到浏览器，因此不能视作密码。应只授予所需地图服务，配置来源域名和调用配额；切勿将 `FEISHU_APP_SECRET` 提供给浏览器、提交到仓库或写入日志。

## 飞书数据结构

默认字段映射集中在 [`src/lib/poi.ts`](src/lib/poi.ts)，可按实际表格字段名调整。

| 应用属性       | 默认飞书字段 | 说明                                       |
| -------------- | ------------ | ------------------------------------------ |
| 地点名称与坐标 | `位置`       | 飞书地理位置字段，提供名称、省市区和经纬度 |
| 发布状态       | `状态`       | 仅值严格等于 `已发布` 的记录会显示         |
| 地点类型       | `类型`       | 用于展示与筛选                             |
| 推荐理由       | `评价`       | 纯文本，用于展示推荐理由                   |
| 评分           | `评分`       | 评分字段，建议使用 1–5 分                  |
| 图片           | `图片`       | 飞书附件字段，支持多张图片                 |

服务端会分页读取飞书记录，并过滤未发布或位置不完整的条目。POI 数据和图片使用 5 分钟重验证，飞书短暂不可用时会尽可能保留上一份成功缓存。

## 部署

### Vercel

1. 在 Vercel 导入 GitHub 仓库；项目会自动识别为 **Next.js**。
2. 保持默认构建设置：`pnpm install` 与 `pnpm build`，Node.js 选择 22 或更高版本。
3. 添加上方所有环境变量；至少配置 Production，建议 Preview 环境也配置。
4. 部署后，把 Vercel 正式域名与自定义域名加入天地图 Key 的来源白名单。

## 开发

执行提交前检查：

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

## 项目结构

```text
src/
├── app/
│   ├── api/poi-image/     # 飞书图片的服务端受控代理
│   ├── layout.tsx
│   └── page.tsx           # 服务端读取 POI 并渲染页面
├── components/
│   ├── poi-explorer.tsx   # 搜索、筛选、列表及图片预览
│   └── poi-map.tsx        # Leaflet 地图与标记交互
└── lib/
    ├── coordinates.ts     # 坐标转换
    ├── feishu.ts          # 飞书 API、字段标准化与缓存
    └── poi.ts             # POI 类型与飞书字段映射
```

## 贡献

欢迎通过 Issue 讨论功能建议或问题；提交 Pull Request 前，请确保上述开发检查全部通过，并说明改动的动机与验证方式。

## 许可证

[MIT](LICENSE)
