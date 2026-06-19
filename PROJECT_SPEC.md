# 🌿 Digital Garden — 项目执行规范

> **角色**: 你是一位精通前端架构、DevOps 并拥有 Apple 级 UI/UX 品味的资深设计工程师。
> **目标**: 维护和扩展这个"下一代个人知识库"，保持代码优雅、视觉统一、交互流畅。
>
> ⚠️ **本文件为项目长期记忆。任何 AI 在本项目中编写代码前，必须先阅读并遵守本规范。**

---

## 1. 项目身份

| 属性 | 值 |
|------|-----|
| 名称 | `astro-wiki` / Digital Garden |
| 本质 | 完全组件化、支持深度交互的个人知识库（非普通博客） |
| 核心隐喻 | **数字花园** — 知识像植物一样自由生长、交叉关联 |
| GitHub | `nicheface/astro-wiki` |
| 公开地址 | `https://nicheface.github.io/astro-wiki` |

---

## 2. MDX 写作哲学：用组件思考（🔥 核心理念）

### 为什么选 MDX 而不是普通 Markdown？

普通 Markdown 只能表达**静态文字**。MDX 让你在文章中直接嵌入 React 组件——**笔记不再只是文字，而是一个可交互的应用**。这是整个 Digital Garden 项目存在的根本原因。

### 写作黄金法则：能用组件就不用文字

每当你准备写一段文字来解释某个事物时，先问自己：

| 你准备写什么 | 应该用什么组件 | 效果 |
|-------------|--------------|------|
| "A 和 B 的区别在于..." | 两个对比卡片并排展示 | 视觉对比 > 文字罗列 |
| "从 2020 到 2025，数据增长了..." | **DataChart** 折线图/柱状图 | 趋势一目了然 |
| "X 是一个重要概念，它的定义是..." | **HoverDetail** 悬浮词条 | 减少认知摩擦 |
| "下面这段代码演示了..." | **LiveCodeBlock** 可编辑沙盒 | 读者可以动手修改运行 |
| 配图 + 一句话摘要 | **SmartImageCard** | 瀑布流知识索引 |

### 组件选择决策树

```
你要表达什么？
├─ 数据趋势 / 对比数值 → DataChart（折线图 or 柱状图）
├─ 术语 / 概念解释 → HoverDetail
├─ 代码演示 → LiveCodeBlock
├─ 配图 + 摘要 → SmartImageCard
├─ A vs B 对比 → 两个 SmartImageCard 并排
├─ 时间线 / 流程 → 可在 MDX 中用纯 HTML + Tailwind 构建自定义布局
└─ 复杂自定义 → 编写新的 React 组件 + Astro 包装器
```

### 读者体验优先级

1. **可视化 > 文字**：图表、卡片、代码沙盒
2. **交互 > 静态**：可悬浮、可点击、可修改运行
3. **即时理解 > 翻阅查阅**：词条解释当场展开，不必跳转到附录
4. **对比并排 > 逐个罗列**：两个卡片并排展示差异

### 新增组件指南

当你觉得现有 4 个组件不够用时：
1. 在 `src/components/` 下创建 `NewFeature.tsx`（React 核心）
2. 创建 `NewFeatureWrapper.astro`（Astro 包装，加 `client:load`）
3. 在 MDX 中导入包装器使用
4. 更新本文件的 §8 和 §9

---

## 3. 技术栈（不可随意更改）

| 层面 | 技术 | 版本 |
|------|------|------|
| 框架 | Astro | ^6.x |
| UI 运行时 | React（通过 `@astrojs/react`） | ^19.x |
| 样式 | Tailwind CSS v4（通过 `@tailwindcss/postcss`） | ^4.x |
| 内容 | MDX（`@astrojs/mdx`） | ^6.x |
| 图表 | Recharts | ^3.x |
| 代码沙盒 | 原生 `textarea` + `iframe srcdoc`（零外部依赖） | — |
| 标题锚点 | `rehype-slug`（为 TOC 导航生成标题 id） | — |
| 搜索 | `pagefind`（构建时生成静态索引） | ^1.x |
| 暗色模式 | Tailwind `@custom-variant dark` + localStorage | — |
| 包管理 | npm（镜像源：`registry.npmmirror.com`） | — |
| 部署 | GitHub Actions → GitHub Pages | — |

### 为什么用 PostCSS 而非 Vite 插件？

`@tailwindcss/vite@4.3` 依赖 Vite 8，但 Astro 6 内置 Vite 7。因此使用 `@tailwindcss/postcss`，在 `astro.config.mjs` 的 `vite.css.postcss.plugins` 中注册。

---

## 4. UI/UX 设计系统（Apple 极简主义）

### 3.1 空间法则 — 极致留白

```
使用: gap-8, p-10, leading-loose, my-16, py-12
禁止: 紧凑布局, gap-2, p-2, leading-tight（除标题外）
```

- 阅读区域最大宽度：`max-w-4xl`（约 56rem / 896px）
- 主内容 padding：`px-6 sm:px-10 py-12 sm:py-16`

### 3.2 色彩体系

| 用途 | Tailwind 类名 |
|------|--------------|
| 主文字 | `text-zinc-900` |
| 副文字 | `text-zinc-600` |
| 辅助文字 | `text-zinc-500` |
| 弱化文字 | `text-zinc-400` |
| 元信息 | `text-zinc-300` |
| 强调色（链接/交互） | `text-blue-600` / `hover:text-blue-500` |
| 强调色（装饰） | `bg-blue-50`, `bg-blue-500` |
| 背景 | `bg-white` |
| 次级背景 | `bg-zinc-50` |
| 边框 | `border-zinc-100`, `border-zinc-200/60` |

**禁忌**: ❌ 不使用 `gray-*`（用 `zinc-*`），❌ 不使用过饱和色。

### 3.3 质感与光影

```css
/* 标准卡片容器 */
rounded-2xl bg-white border border-zinc-100/60
shadow-[0_8px_30px_rgb(0,0,0,0.04)]

/* 毛玻璃导航 */
backdrop-blur-xl bg-white/70 supports-[backdrop-filter]:bg-white/60
border-b border-zinc-200/40

/* 悬浮气泡 */
rounded-2xl bg-white/80 backdrop-blur-2xl border border-zinc-100/60
shadow-[0_12px_40px_rgb(0,0,0,0.08)]

/* Hover 上浮效果 */
transition-all duration-500 ease-out
hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1
```

**原则**: 无实线边框（`border-2 border-solid` 永远不用），只用极淡的 1px 分隔线。

### 3.4 动效规范

| 场景 | 动效 |
|------|------|
| 颜色/背景过渡 | `transition-colors duration-200` |
| 尺寸/位置过渡 | `transition-all duration-300 ease-out` |
| 卡片/大型元素 | `transition-all duration-500 ease-out` |
| 图片缩放 | `transition-all duration-700 ease-out` |

**必须**: 所有可交互元素（链接、按钮、卡片）都需要 hover/active 状态反馈。

### 3.5 排版

- 字体：系统无衬线栈（`-apple-system, BlinkMacSystemFont, "SF Pro Display", ...`）
- 等宽：`"SF Mono", "JetBrains Mono", "Fira Code", monospace`
- 标题字重：`font-bold`（h1）→ `font-semibold`（h2）→ `font-medium`（h3）
- 正文字号：`text-lg`（约 18px）
- 行高：`leading-loose`（正文）、`leading-relaxed`（辅助）

---

## 5. 组件架构模式（关键！）

### 4.1 核心原则：React 组件 + Astro 包装器

**React 组件（`*.tsx`）**：包含交互逻辑、状态管理。使用 `"use client"` 指令。

**Astro 包装器（`*Wrapper.astro`）**：为 React 组件添加 `client:load` 指令，使组件在浏览器端水合。

```
src/components/
├── FooBar.tsx           ← React 核心逻辑（export default）
├── FooBarWrapper.astro  ← Astro 包装（import + client:load）
```

### 4.2 包装器模板

```astro
---
// FooBarWrapper.astro
import FooBar from "./FooBar.tsx";
---

<FooBar
  client:load
  prop1={Astro.props.prop1}
  prop2={Astro.props.prop2}
>
  <slot />
</FooBar>
```

### 4.3 为什么需要包装器？

MDX 文件中无法给导入的组件直接添加 `client:*` 指令。没有 `client:load`，React 组件仅执行服务端渲染（SSR）生成静态 HTML，不进行客户端水合 → **所有交互（useState、useEffect、事件处理）全部失效**。

### 4.4 MDX 导入规则

```mdx
<!-- ✅ 正确：导入 Astro 包装器 -->
import DataChart from "../components/DataChartWrapper.astro";
import HoverDetail from "../components/HoverDetailWrapper.astro";
import LiveCodeBlock from "../components/LiveCodeBlockWrapper.astro";

<!-- ✅ 正确：纯静态 Astro 组件可直接导入 -->
import SmartImageCard from "../components/SmartImageCard.astro";

<!-- ❌ 错误：不要直接导入 React tsx 组件到 MDX -->
import DataChart from "../components/DataChart.tsx";  <!-- 无交互！ -->
```

---

## 6. 项目结构

```
astro-wiki/
├── .github/workflows/deploy.yml    # CI/CD（不可随意修改）
├── public/                         # 静态资源（favicon 等）
├── src/
│   ├── components/
│   │   ├── DataChart.tsx           # 图表核心
│   │   ├── DataChartWrapper.astro  # 图表包装 (client:load)
│   │   ├── HoverDetail.tsx         # 悬浮词条核心
│   │   ├── HoverDetailWrapper.astro
│   │   ├── LiveCodeBlock.tsx       # 代码沙盒核心
│   │   ├── LiveCodeBlockWrapper.astro
│   │   ├── TagFilter.tsx            # 标签筛选核心
│   │   ├── TagFilterWrapper.astro   # 标签筛选包装 (client:load)
│   │   ├── ArticleTag.tsx           # 文章内标签 + 关联笔记弹窗
│   │   ├── ArticleTagWrapper.astro  # 文章内标签包装 (client:load)
│   │   └── SmartImageCard.astro    # 图片卡片（纯 Astro，无需包装）
│   ├── data/
│   │   ├── articles.ts              # 文章注册表（统一数据源）
│   │   └── tags.ts                  # 三级标签层级体系
│   ├── layouts/
│   │   └── Layout.astro            # 全局主布局
│   ├── pages/
│   │   ├── index.astro             # 首页
│   │   └── *.mdx                   # 知识笔记（MDX）
│   └── styles/
│       └── global.css              # Tailwind v4 + 全局排版
├── astro.config.mjs                # 核心配置
├── tsconfig.json
├── PROJECT_SPEC.md                 # 📋 本文件 — 项目长期记忆
└── README.md
```

### 新增笔记规则

- **位置**: `src/pages/` 下新建 `.mdx` 文件
- **命名**: `数字前缀-英文短名.mdx`（如 `02-thinking-in-systems.mdx`）
- **Frontmatter**: 必须包含 `layout: ../layouts/Layout.astro` 和 `title`

---

## 7. 部署流水线

### 6.1 触发条件

- 推送到 `main` 分支 → 自动构建部署
- 也可在 GitHub Actions 页面手动触发

### 6.2 构建流程

```
checkout → Node 22 → npm install → npm run build → upload dist → deploy Pages
```

### 6.3 关键配置

| 文件 | 字段 | 值 |
|------|------|-----|
| `astro.config.mjs` | `site` | `https://nicheface.github.io` |
| `astro.config.mjs` | `base` | `/astro-wiki` |
| `astro.config.mjs` | CSS | PostCSS + `@tailwindcss/postcss` |

### 6.4 本地命令

```bash
npm run dev      # 开发 → http://localhost:4321/astro-wiki
npm run build    # 构建 → dist/
npm run preview  # 预览构建产物
```

---

## 8. 已有组件 API 速查

### DataChart

```mdx
<DataChart
  data={[{ year: "2020", value: 42 }, ...]}
  type="line"          // "line" | "bar"
  dataKey="value"      // Y 轴字段
  xKey="year"          // X 轴字段
  color="#3b82f6"      // 可选，默认蓝色
  title="图表标题"      // 可选
  height={300}         // 可选，默认 320
/>
```

### SmartImageCard

```mdx
<SmartImageCard
  src="https://..."    // 图片 URL
  alt="描述"
  title="卡片标题"
  summary="AI 摘要"
  href="/article"      // 可选
/>
```

### HoverDetail

```mdx
<HoverDetail term="词条名" href="https://...">
  词条的详细解释（支持多行、JSX）
</HoverDetail>
```

### LiveCodeBlock（纯原生，零外部依赖）

```mdx
<LiveCodeBlock
  title="演示标题"
  previewHeight={360}
  code={`<!DOCTYPE html>
<html>
<body><h1>Hello</h1></body>
</html>`}
/>
```

**实现原理**: `textarea`（代码编辑）+ `iframe srcdoc`（实时预览）。不依赖任何外部服务，完全离线可用。

**设计决策**: 原计划使用 `@codesandbox/sandpack-react`，但其内部 `__csb_relay` 中继页依赖外部 CDN，在国内网络环境下加载失败导致白屏。替换为纯原生方案后，包体积减少 ~500KB，且永不依赖外部网络。

---

## 9. 已知陷阱与禁止操作

### ❌ 禁止

| 操作 | 原因 |
|------|------|
| 使用 `@codesandbox/sandpack-react` | 国内网络 `__csb_relay` 加载失败 → 白屏，已替换为原生方案 |
| MDX 中 `<HoverDetail>` 标签内断行 | MDX 将换行视为段落边界 → 编译报错。**所有 JSX 组件标签必须与 children 在同一行** |
| 在 MDX 中直接导入 `.tsx` React 组件 | 无 `client:load` → 交互全部失效 |
| 使用 `@tailwindcss/vite` | 与 Astro 6 的 Vite 7 版本冲突 |
| 使用 `gray-*` 色系 | 项目统一使用 `zinc-*` |
| 使用实线粗边框（`border-2` 等） | 破坏 Apple 极简美学 |

### ✅ 必须

| 操作 | 原因 |
|------|------|
| 所有 React 组件使用 `.tsx` 扩展名 | 支持 TypeScript 类型注解 |
| 新增交互组件必须建配套 `Wrapper.astro` | 确保 MDX 中可用且可交互 |
| CSS 全局样式走 `src/styles/global.css` | 统一管理 Tailwind 和排版 |
| 所有链接/按钮加过渡动效 | 维持 Apple 交互品质 |
| 国内环境用 `registry.npmmirror.com` | 加速下载 |

---

## 10. 代码风格约定

### React 组件

```tsx
// ✅ 类型定义在组件文件内
interface FooProps { ... }

// ✅ "use client" 在文件顶部
"use client";

// ✅ 默认导出
export default function Foo({ prop1, prop2 }: FooProps) {
  return <div className="...">...</div>;
}
```

### Astro 组件

```astro
---
// ✅ Props 接口定义在 frontmatter
export interface Props { ... }
const { prop1, prop2 } = Astro.props;
---

<!-- ✅ 类名顺序: 布局 → 视觉 → 交互 -->
<div class="not-prose rounded-2xl bg-white border border-zinc-100/60 transition-all duration-300 ease-out hover:shadow-[...]">
  <slot />
</div>
```

### Tailwind 类名组织

1. `not-prose`（如在 MDX 区域内）
2. 布局：`block`, `flex`, `grid`, `relative`, `absolute`
3. 间距：`p-*`, `m-*`, `gap-*`, `space-y-*`
4. 尺寸：`w-*`, `h-*`, `max-w-*`
5. 视觉：`rounded-*`, `bg-*`, `text-*`, `border-*`, `shadow-[...]`
6. 动效：`transition-all duration-* ease-out`

---

## 11. 版本历史

| 日期 | 变更 | 提交 |
|------|------|------|
| 2026-06-20 | 初始化项目，完整骨架搭建 | `1fb7781` |
| 2026-06-20 | 修复：为 React 组件添加 client:load 包装器 | `e4d0175` |
| 2026-06-20 | 修复：移除 Sandpack 的无效 bundlerURL | `b93c328` |
| 2026-06-20 | 文档：创建项目执行规范 PROJECT_SPEC.md | 当前 |
| 2026-06-20 | 新增 §2 MDX 写作哲学：用组件思考 | 当前 |
| 2026-06-20 | 重构：LiveCodeBlock 从 Sandpack 替换为原生 textarea+iframe | 当前 |
| 2026-06-20 | 新增笔记：Litestar 高性能 ASGI Python Web 框架 | 当前 |
| 2026-06-20 | 新增：TagFilter 组件——首页标签筛选功能 | 当前 |
| 2026-06-20 | 重构：三级标签层级体系 + ArticleTag 关联弹窗 + 集中数据源 | 当前 |
| 2026-06-20 | 新增：暗色模式（DarkToggle + 全局 dark: 变体 + localStorage） | 当前 |
| 2026-06-20 | 新增：三栏文章布局（左时间线 + 正文 + 右目录导航） | 当前 |
| 2026-06-20 | 重构：标签系统按用户分类（编程/生活/思考 → python/前端 → astro 等）| 当前 |
| 2026-06-20 | 经验：MDX 中 JSX 组件必须与 children 同行，不可断行 | 当前 |

---

> 📖 **AI 须知**：在开始编写任何代码前，阅读本文件（至少第 2-9 节）。如果遇到新的技术决策或踩坑经验，请更新本文件并将变更提交到 Git。
