# chat-client

基于 **React** + **Vite** 的浏览器端 **Gemini** 对话客户端：在页面内直连 Google Gemini API，支持**流式回复**、Markdown 渲染、消息复制与贴底滚动。

## 技术栈

| 类别 | 说明 |
|------|------|
| 运行时 | React 19、TypeScript |
| 构建 | Vite 8，路径别名 `@/` → `src/` |
| UI | Ant Design 6 |
| AI | `@google/genai`（`generateContentStream` 流式生成） |
| 内容 | `react-markdown` + `remark-gfm`（助手回复） |
| 其它 | React Compiler（Babel `reactCompilerPreset`） |

## 功能概览

- **流式输出**：逐 token/chunk 追加到当前助手气泡，不阻塞整段返回。
- **贴底滚动**：仅在用户处于列表底部附近时随内容增高自动下滚；上滑阅读历史时不会强行拉回（`useStickToBottom`）。
- **复制**：用户消息与助手消息均可一键复制（`useCopyToClipboard` + `CopyIconButton`）。
- **上游限流/过载**：对 Google API 返回的 **429 / 503** 单独 `message.warning`，其余错误在气泡内展示。

## 环境要求

- **Node.js**（建议 LTS）
- 包管理：**pnpm**（项目使用 `pnpm-lock.yaml`）

## 本地运行

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 Gemini（必做）

密钥与默认模型通过 **本地配置文件** 注入（**勿提交**）：

1. 复制模板文件：

   ```bash
   cp src/config/ai.config.example.ts src/config/ai.config.local.ts
   ```

   Windows PowerShell 可用：`Copy-Item src/config/ai.config.example.ts src/config/ai.config.local.ts`

2. 编辑 `src/config/ai.config.local.ts`，填写 **`GEMINI_API_KEY`**，按需修改 **`GEMINI_MODEL`**。

`ai.config.local.ts` 已列入 `.gitignore`。聚合逻辑见 `src/config/ai.config.ts`（使用 `import.meta.glob` 加载本地模块）。

### 3. 启动开发服务器

```bash
pnpm dev
```

浏览器访问终端提示的本地地址即可。

### 构建与预览

```bash
pnpm build
pnpm preview
```

`vite.config.ts` 中 `base: "./"`，便于静态资源相对路径部署。

## GitHub Pages 自动部署密钥配置

如果使用仓库内的 `pages.yml` 自动部署到 GitHub Pages，需要在仓库中配置 Actions Secret：

1. 打开仓库 `Settings` -> `Secrets and variables` -> `Actions`。
2. 点击 `New repository secret`。
3. Name 填写：`GEMINI_API_KEY`。
4. Secret 填写你的 Gemini API Key。
5. 保存后再次触发 `pages.yml`（push 到 `main/master` 或手动 `Run workflow`）。

部署流程会在构建前自动生成 `src/config/ai.config.local.ts`，并将 `GEMINI_API_KEY` 注入该文件。

## 目录结构（摘要）

```
src/
  api/chat/          # 发送消息、上游错误文案、消息类型
  components/        # 通用组件（如复制按钮、图标）
  config/            # ai.config.ts / ai.config.example.ts（+ 本地 ai.config.local.ts）
  hooks/             # 贴底滚动、剪贴板等
  pages/chatWindow/  # 聊天主界面与消息列表、输入栏等
```

## 安全说明

- **API Key 会进入前端打包产物**，任何能打开页面的人都有可能从网络或源码中拿到密钥，**不适合**在完全公开的站点上裸奔使用。
- 若仓库曾提交过密钥，请在 Google Cloud 控制台**轮换密钥**，并避免将 `ai.config.local.ts` 加入版本控制。

## 许可证

私有项目；依赖库各自遵循其开源协议。
