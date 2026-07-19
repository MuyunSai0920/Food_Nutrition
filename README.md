# 食刻 / Shike Local Nutrition

一个可以自行部署的中文饮食记录 Web 应用。它在浏览器中保存数据，不需要账户、数据库或 API Key。

## 功能

- 上传餐盘图片并添加识别结果；重量与食物均可人工确认和修改。
- 依据 `碳水 × 4 + 蛋白质 × 4 + 脂肪 × 9` 计算热量。
- 查询内置食物库中每 100g 的碳水、蛋白质、脂肪与热量。
- 将每日饮食记录保存在浏览器 IndexedDB，并按日期查看历史记录。
- 响应式界面，手机和电脑均可使用。

## 识别能力说明

为了让项目无需账号、密钥和云服务即可运行，当前版本使用图片**文件名**匹配内置食物关键词。例如上传 `鸡胸肉_米饭.jpg` 会添加“鸡胸肉（熟）”和“米饭（熟）”。识别结果始终可以编辑。

如需从图片像素中识别食物，可在 [`app/page.tsx`](app/page.tsx) 的 `scanFile` 函数中，将关键词匹配替换为调用本地视觉服务的请求，例如 Ollama + LLaVA 或 ONNX 食物检测模型。建议让服务返回：

```ts
[{ foodId: "chicken", confidence: 0.93, estimatedGrams: 150 }]
```

单张普通图片无法精确称重；生产版本应使用参照物、多角度图像，并保留用户确认重量的步骤。

## 本地运行

### 环境要求

- Node.js 22 或更高版本
- pnpm 10 或更高版本（可通过 `corepack enable` 启用）

### 启动

```bash
pnpm install
pnpm run dev
```

打开命令行打印的 `http://localhost:xxxx` 地址。

### 生产模式预览

```bash
pnpm run build
pnpm run start
```

## 部署到 Cloudflare Workers

这是项目原生支持的部署方式。先注册 Cloudflare 账户，然后在项目目录运行：

```bash
pnpm exec wrangler login
pnpm run deploy
```

首次部署会要求授权 Cloudflare，并创建名为 `shike-local-nutrition` 的 Worker。完成后，终端会输出公网 URL。

本应用的饮食记录使用访问者自己的浏览器 IndexedDB 保存。因此即使部署到公网，也不会把图片或饮食记录上传到服务器；清除浏览器网站数据会同时清除记录。

## 上传到 GitHub

1. 在 GitHub 新建一个空仓库，例如 `shike-local-nutrition`；不要勾选 README、`.gitignore` 或 License。
2. 在此项目目录运行以下命令，并将 `<你的仓库地址>` 换成 GitHub 的 HTTPS 或 SSH 地址：

```bash
git init
git add .
git commit -m "feat: add local nutrition tracker"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

`.gitignore` 已排除依赖、构建产物、开发日志和环境变量。不要把 `.env`、Cloudflare token 或任何 API Key 提交到仓库。

## 校验命令

```bash
pnpm run build
pnpm test
pnpm run lint
```

## 技术栈

- React 19 + TypeScript
- Vinext / Vite
- Cloudflare Workers（可选部署目标）
- IndexedDB（浏览器本地持久化）
