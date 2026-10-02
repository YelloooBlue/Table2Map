# Table2Map

🗺️ 将飞书多维表格中的已发布地点渲染为团队可用的交互式地图。

## 本地运行

需要 Node.js 22+ 和 pnpm 10。

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

将飞书与天地图变量填入 `.env.local`；该文件已被 Git 忽略，不能提交。

### 用手机在局域网调试

Next.js 16 会保护开发期的脚本和接口。本项目允许 macOS 的 Bonjour `.local` 主机名访问开发资源，因此无需将会变化的局域网 IP 写入环境变量。

用局域网监听模式启动：

```bash
pnpm dev:lan
```

通过本地主机名访问：`http://<本地主机名>.local:3000`。macOS 可用下列命令查看该名称；它不会随局域网 IP 变化。

```bash
scutil --get LocalHostName
```

## 常用检查

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## 项目约定

- 飞书多维表格是唯一内容来源，只展示状态为 `已发布` 的记录。
- 服务端负责获取飞书数据和保管凭据；浏览器只接收标准化后的 POI 数据。
- 飞书位置字段按 GCJ-02 读取，地图适配层集中处理坐标转换。
- 天地图 Key 必须限制到实际部署域名；它是公开瓦片 Key，飞书密钥则必须保持私密。

完整产品范围与字段约定见 [首版需求](docs/requirements.md)。
