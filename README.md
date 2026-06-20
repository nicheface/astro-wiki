# Noösphere — 静默生长的思想之网

> 知识库消隐之处，认知开始呼吸。

Noösphere（心智层）是德日进提出的概念——环绕地球的无形思想之网，人类集体心智交织而成的认知场。这个网站不是知识库。它是一组静默生长的思想拓扑，一处界面隐入知觉的实验场。

基于 [Astro](https://astro.build) 构建，使用 MDX（Markdown + JSX）让笔记成为可交互的认知对象。集成 AI 问答、交互式概率游乐场、数据图表、悬浮词条、代码沙盒等组件。

---

## 🛠️ 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | [Astro 6](https://astro.build) |
| UI 运行时 | [React 19](https://react.dev) |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com) |
| 内容 | [MDX](https://mdxjs.com) |
| 图表 | [Recharts](https://recharts.org) |
| Markdown 渲染 | [marked](https://marked.js.org) |
| 搜索 | [Pagefind](https://pagefind.app)（构建时静态索引） |
| AI | DeepSeek API（Studio 问答） |
| 暗色模式 | Tailwind `dark:` + localStorage |
| 部署 | GitHub Actions → GitHub Pages |

---

## 🚀 本地运行

```bash
git clone https://github.com/nicheface/astro-wiki.git
cd astro-wiki
npm install
npm run dev
# http://localhost:4321/astro-wiki
```

---

## 🧩 组件体系

### 内容组件（文章内使用）

| 组件 | 用途 |
|------|------|
| `ArticleHero` | 文章头图 + 玄深一句话（**每篇笔记必须**） |
| `DataChart` | 折线图 / 柱状图，Recharts 驱动 |
| `HoverDetail` | 悬浮词条，即时术语解释 |
| `SmartImageCard` | 配图 + AI 摘要卡片 |
| `LiveCodeBlock` | 可编辑、可运行的代码沙盒 |
| `SwotCard` | 并排 S/W 对比卡片 |
| `StepFlow` | 步骤流程可视化 |
| `ArticleTag` | 文章标签 + 关联弹窗 |
| `ProbabilityPlayground` | 交互式泊松分布游乐场 |

### 页面组件

| 组件 | 用途 |
|------|------|
| `TagFilter` | 首页标签筛选 + 文章列表 |
| `ArticleTimeline` | 左栏年份文章导航 |
| `TableOfContents` | 右栏目录导航（IntersectionObserver 滚动跟踪） |
| `SearchBox` | Pagefind 全站搜索（导航栏按钮 + 文章内嵌两种形态） |
| `DarkToggle` | iOS 风格暗色模式切换 |
| `Studio` | AI 知识库问答（密码保护） |

---

## 📂 项目结构

```
astro-wiki/
├── .github/workflows/deploy.yml
├── public/
├── src/
│   ├── components/
│   │   ├── ArticleHero.astro           # 🆕 文章头图（固定结构）
│   │   ├── ProbabilityPlayground.tsx    # 🆕 泊松交互游乐场
│   │   ├── Studio.tsx                  # 🆕 AI 问答
│   │   ├── DataChart.tsx / Wrapper
│   │   ├── HoverDetail.tsx / Wrapper
│   │   ├── LiveCodeBlock.tsx / Wrapper
│   │   ├── SmartImageCard.astro
│   │   ├── SwotCard.astro
│   │   ├── StepFlow.astro
│   │   ├── SearchBox.tsx / Wrapper
│   │   ├── TagFilter.tsx / Wrapper
│   │   ├── ArticleTag.tsx / Wrapper
│   │   ├── ArticleTimeline.astro
│   │   ├── TableOfContents.tsx / Wrapper
│   │   └── DarkToggle.tsx / Wrapper
│   ├── data/
│   │   ├── articles.ts
│   │   └── tags.ts
│   ├── layouts/
│   │   ├── Layout.astro
│   │   └── ArticleLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── studio.astro                # 🆕 AI 问答（密码保护）
│   │   └── 01~07-*.mdx                # 7 篇笔记
│   └── styles/
│       └── global.css
├── PROJECT_SPEC.md
├── NOTE_WRITING_GUIDE.md
└── README.md
```

---

## 📝 新增笔记

1. 在 `src/pages/` 创建 `XX-slug.mdx`
2. Frontmatter: `layout` / `title` / `description` / `currentHref` / `tags`
3. 引入 `ArticleHero` 添加头图 + 图注（**必须**）
4. 在 `src/data/articles.ts` 注册
5. 推送 → Action 构建 → Studio 自动索引

---

## 🏷️ 标签三级体系

- **一级**：编程 / 生活 / 思考
- **二级**：Python / 前端 / Web / AI / 知识管理 / 方法论
- **三级**：Litestar / Astro / React / 概率论 / 统计学 / 哲学 / 历史 / 决策

---

## 🔧 配置

`astro.config.mjs` 中修改 `site` 和 `base` 适配自己的域名。

MIT © 2026
