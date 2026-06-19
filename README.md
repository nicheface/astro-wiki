# 🌿 Digital Garden — 下一代个人知识库

> **「让知识自由生长，让笔记拥有超能力。」**

Digital Garden 是一个基于 [Astro](https://astro.build) 构建的完全组件化个人知识库。它不仅支持 MDX（Markdown + JSX），还内置了四个强大的交互组件——**数据图表**、**AI 智能卡片**、**沉浸式词条悬浮**和**可编辑代码沙盒**——让你的笔记拥有原生 App 级的视觉与交互体验。

---

## 🎯 设计哲学

| 原则 | 含义 |
|------|------|
| **极致留白** | 使用 `gap-8`、`p-10`、`leading-loose`，让内容自由呼吸 |
| **纯净配色** | 黑白灰体系 (`text-zinc-*`)，辅以克制蓝 (`text-blue-600`) |
| **毛玻璃质感** | `backdrop-blur-xl` + 弥散阴影，去除生硬边框 |
| **丝滑动效** | 所有交互附带 `transition-all duration-300 ease-out` |

---

## 🛠️ 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | [Astro 6](https://astro.build) |
| UI 运行时 | [React 19](https://react.dev) (`@astrojs/react`) |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com) (`@tailwindcss/vite`) |
| 内容 | [MDX](https://mdxjs.com) (`@astrojs/mdx`) |
| 图表 | [Recharts](https://recharts.org) |
| 代码沙盒 | 原生 `textarea` + `iframe srcdoc`（零外部依赖） |
| 标题锚点 | [rehype-slug](https://github.com/rehypejs/rehype-slug) |
| 部署 | GitHub Actions → GitHub Pages |

---

## 🚀 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/nicheface/astro-wiki.git
cd astro-wiki

# 2. 安装依赖（国内用户建议先切换镜像源）
npm config set registry https://registry.npmmirror.com
npm install

# 3. 启动开发服务器
npm run dev

# 4. 在浏览器打开
# http://localhost:4321/astro-wiki
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run preview` | 本地预览生产构建 |

---

## 📱 移动端同步（Android Termux / Git）

在安卓设备上通过 Termux 编辑和同步笔记：

```bash
# 1. 安装 Termux（F-Droid 版本推荐）

# 2. 安装必要工具
pkg update && pkg upgrade
pkg install git nodejs-lts openssh

# 3. 克隆仓库
git clone https://github.com/nicheface/astro-wiki.git
cd astro-wiki

# 4. 安装依赖（Termux 中需要增加超时时间）
npm config set registry https://registry.npmmirror.com
npm install

# 5. 日常同步流程
git pull origin main          # 拉取最新
# ... 编辑笔记 ...
git add . && git commit -m "📝 update notes"
git push origin main
```

> **注意**：Termux 上 `npm install` 可能较慢，建议首次安装后不要频繁删除 `node_modules`。

---

## 🧩 四大超级组件使用指南

### 1. DataChart — 数据图表

在 MDX 中嵌入可视化图表：

```mdx
import DataChart from "../components/DataChartWrapper.astro";

<DataChart
  data={[
    { year: "2020", value: 42 },
    { year: "2021", value: 89 },
    { year: "2022", value: 156 },
  ]}
  type="line"          // "line" 或 "bar"
  dataKey="value"      // Y 轴数值字段
  xKey="year"          // X 轴标签字段
  color="#3b82f6"      // 强调色（可选，默认蓝色）
  title="年度增长"      // 图表标题（可选）
  height={300}         // 高度 px（可选，默认 320）
/>
```

### 2. SmartImageCard — AI 智能卡片

适合做知识索引的瀑布流卡片：

```mdx
import SmartImageCard from "../components/SmartImageCard.astro";

<SmartImageCard
  src="https://example.com/photo.jpg"
  alt="描述"
  title="卡片标题"
  summary="AI 生成的摘要文字，支持一到两行。"
  href="/full-article"  // 可选，有链接时卡片可点击
/>
```

### 3. HoverDetail — 沉浸式词条悬浮

在文章内嵌即时术语解释：

```mdx
import HoverDetail from "../components/HoverDetailWrapper.astro";

知识管理的未来趋势是
<HoverDetail term="数字花园" href="https://en.wikipedia.org/wiki/Digital_garden">
  数字花园是一种非线性、持续生长的个人知识管理范式。内容不按时间排序，
  而是像植物一样自由生长、交叉关联。
</HoverDetail>
的兴起。
```

### 4. LiveCodeBlock — 可编辑代码沙盒（纯原生）

在笔记中嵌入一个可编辑、可运行的代码演示，零外部依赖：

```mdx
import LiveCodeBlock from "../components/LiveCodeBlockWrapper.astro";

<LiveCodeBlock
  title="演示：一个交互式例子"
  previewHeight={320}
  code={`<!DOCTYPE html>
<html>
<body>
  <h1>Hello, Digital Garden!</h1>
</body>
</html>`}
/>
```

---

### 5. ArticleTag — 文章内标签（点击弹出关联笔记）

每篇文章顶部的标签是可点击的，点击会弹出包含同一标签的其他笔记：

```mdx
import ArticleTag from "../components/ArticleTagWrapper.astro";

<ArticleTag tagKey="python" /> <ArticleTag tagKey="litestar" />
```

标签在 `src/data/tags.ts` 中定义，三级层级体系：
- **一级**（编程、生活、思考）→ 领域
- **二级**（Python、前端、Web）→ 主题
- **三级**（Litestar、Astro、React）→ 具体技术

---

## 🏷️ 标签系统

所有标签在 `src/data/tags.ts` 中定义为三级层级（一级领域 → 二级主题 → 三级具体技术）。每篇文章在 `src/data/articles.ts` 中注册标签后，首页筛选区自动出现。文章内标签点击可弹出关联笔记。

---

## 📂 项目结构

```
astro-wiki/
├── .github/workflows/deploy.yml   # 自动部署脚本
├── public/                         # 静态资源 (favicon, etc.)
├── src/
│   ├── components/
│   │   ├── DataChart.tsx            # 数据图表核心
│   │   ├── DataChartWrapper.astro   # 图表 Astro 包装 (client:load)
│   │   ├── HoverDetail.tsx          # 悬浮词条核心
│   │   ├── HoverDetailWrapper.astro # 悬浮词条 Astro 包装
│   │   ├── LiveCodeBlock.tsx        # 代码沙盒核心
│   │   ├── LiveCodeBlockWrapper.astro
│   │   ├── SmartImageCard.astro     # AI 智能图片卡片
│   │   ├── TagFilter.tsx            # 首页标签筛选核心
│   │   ├── TagFilterWrapper.astro   # 标签筛选包装
│   │   ├── ArticleTag.tsx           # 文章内标签 + 关联弹窗
│   │   ├── ArticleTagWrapper.astro  # 文章标签包装
│   │   ├── ArticleTimeline.astro    # 左栏年份文章列表
│   │   ├── TableOfContents.tsx      # 右栏目录导航核心
│   │   └── TableOfContentsWrapper.astro
│   ├── data/
│   │   ├── articles.ts              # 文章注册表（统一数据源）
│   │   └── tags.ts                  # 三级标签层级体系
│   ├── layouts/
│   │   ├── Layout.astro             # 基础布局（首页/关于）
│   │   └── ArticleLayout.astro      # 三栏文章布局（MDX 笔记）
│   ├── pages/
│   │   ├── index.astro              # 首页
│   │   ├── about.astro              # 关于页面
│   │   ├── 01-future-of-knowledge.mdx
│   │   └── 02-litestar-python-web-framework.mdx
│   └── styles/
│       └── global.css               # 全局样式 + Tailwind
├── astro.config.mjs
├── tsconfig.json
├── PROJECT_SPEC.md                  # AI 执行规范
└── README.md
```

---

## 🔧 配置说明

### 修改站点地址

在 `astro.config.mjs` 中：

```js
export default defineConfig({
  site: "https://nicheface.github.io",  // ← 改为你的 GitHub Pages 地址
  base: "/astro-wiki",                         // ← 改为你的仓库名
  // ...
});
```

### GitHub Pages 部署

1. 将代码推送到 GitHub 的 `main` 分支
2. 在仓库 **Settings → Pages** 中将 Source 设为 **GitHub Actions**
3. 每次推送自动构建并部署

---

## 📝 写作工作流

1. **新建笔记**：在 `src/pages/` 下创建 `.mdx` 文件
2. **设置 frontmatter**：指定 `layout: ../layouts/ArticleLayout.astro`、`title`、`description`、`currentHref`、`tags`
3. **注册文章**：在 `src/data/articles.ts` 中添加条目
4. **引入组件**：在顶部 `import` 需要的组件（包装器版本）
5. **添加标签**：在正文顶部用 `<ArticleTag tagKey="..." />` 展示标签
6. **自由混搭**：Markdown 语法和 JSX 组件可以任意组合
7. **提交发布**：`git push` → GitHub Actions 自动部署

### 布局说明

| 布局文件 | 适用页面 | 特征 |
|----------|---------|------|
| `ArticleLayout.astro` | MDX 笔记 | 三栏：左年份文章列表 + 正文 + 右目录导航 |
| `Layout.astro` | 首页、关于 | 单栏居中，无侧栏 |

---

## 🤖 AI 辅助写作提示

在 AI 助手的对话中，你可以使用以下提示模式来生成超级组件：

```
请帮我写一篇关于 [主题] 的笔记。

在文章中：
- 用 <DataChart> 展示 [相关数据]
- 用 <SmartImageCard> 展示 [配图]
- 用 <HoverDetail> 解释 [关键术语]
- 用 <LiveCodeBlock> 演示 [交互例子]
- 用 <ArticleTag tagKey="..." /> 添加分类标签

完成后，在 src/data/articles.ts 中注册文章。标签 key 参考 src/data/tags.ts。

---

## 📄 License

MIT © 2026
