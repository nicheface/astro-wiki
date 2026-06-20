# Noösphere — 项目执行规范

> **角色**: 你是一位精通前端架构并拥有极致设计品味的资深工程师。
> **目标**: 维护和扩展 Noösphere——一个将静态笔记转化为可交互认知对象的思想之网。
>
> ⚠️ **本文件为项目长期记忆。任何 AI 在本项目中编写代码前，必须先阅读并遵守本规范。**

---

## 1. 项目身份

| 属性 | 值 |
|------|-----|
| 名称 | `astro-wiki` / **Noösphere** |
| 本质 | 完全组件化、支持深度交互的个人知识库（非普通博客） |
| 核心隐喻 | **心智层**（Noösphere）——德日进：环绕地球的无形思想之网 |
| 设计语言 | 极简留白、毛玻璃、界面隐入知觉 |
| 语调 | 文艺、玄深、简洁——每句话掷地有声 |
| GitHub | `nicheface/astro-wiki` |
| 地址 | `https://nicheface.github.io/astro-wiki` |
| Studio | `/studio` 密码保护 AI 问答（密码 `[redacted]`） |

---

## 2. 笔记强制结构

每篇新笔记必须遵循：

```mdx
---
layout: ../layouts/ArticleLayout.astro
title: "标题"
description: "一句话简介"
currentHref: "/astro-wiki/XX-slug"
tags: [...]
---

import ArticleHero from "../components/ArticleHero.astro";
import HoverDetail from "../components/HoverDetailWrapper.astro";
import ArticleTag from "../components/ArticleTagWrapper.astro";

{/* 标签栏 */}
<div class="not-prose mb-8 flex flex-wrap gap-2">
  <ArticleTag tagKey="thinking" /> ...
</div>

{/* 头图 + 图注（必须） */}
<ArticleHero
  src="https://images.unsplash.com/photo-XXXXX?w=1200&h=500&fit=crop"
  alt="描述"
  caption="一句玄深的图注。"
/>

{/* 开篇 */}
<div class="not-prose mb-16">
  <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
    标题
    <span class="block text-xl font-normal text-zinc-400 mt-2">副标题</span>
  </h1>
  <div class="flex items-center gap-4 mt-6">
    <time class="text-sm text-zinc-400" datetime="2026-06-XX">2026 年 6 月 XX 日</time>
    <span class="text-zinc-200">·</span>
    <span class="text-sm text-zinc-400">阅读约 X 分钟</span>
  </div>
</div>
```

**图注要求**：简洁、玄深、与主题形成诗意张力。不超过一行。`text-xs italic tracking-wide text-zinc-400`。

### 写作前必问三问

1. **能否复用已有组件？** ArticleHero / DataChart / HoverDetail / SmartImageCard / LiveCodeBlock / SwotCard / StepFlow / ArticleTag / ProbabilityPlayground
2. **能否创建全新组件？** 一个组件的一次性成本换来的是全站永久的表达力增益
3. **每写完一章，读者看到的是可视化还是干巴巴文字？**

---

## 3. 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Astro 6 |
| UI 运行时 | React 19（`@astrojs/react`） |
| 样式 | Tailwind CSS v4（`@tailwindcss/postcss`） |
| 内容 | MDX（`@astrojs/mdx`） |
| 图表 | Recharts 3 |
| Markdown 渲染 | marked（Studio 端） |
| 搜索 | Pagefind 1（构建时静态索引） |
| 暗色模式 | Tailwind `dark:` + localStorage |
| 部署 | GitHub Actions → GitHub Pages |

---

## 4. 组件全景

### 内容组件（文章内使用）

| 组件 | 文件 | 类型 |
|------|------|------|
| **ArticleHero** 🆕 | `ArticleHero.astro` | Astro 服务端 |
| DataChart | `DataChart.tsx` + `Wrapper.astro` | React 客户端 |
| HoverDetail | `HoverDetail.tsx` + `Wrapper.astro` | React 客户端 |
| SmartImageCard | `SmartImageCard.astro` | Astro 服务端 |
| LiveCodeBlock | `LiveCodeBlock.tsx` + `Wrapper.astro` | React 客户端 |
| SwotCard | `SwotCard.astro` | Astro 服务端 |
| StepFlow | `StepFlow.astro` | Astro 服务端 |
| ArticleTag | `ArticleTag.tsx` + `Wrapper.astro` | React 客户端 |
| **ProbabilityPlayground** 🆕 | `ProbabilityPlayground.tsx` + `Wrapper.astro` | React 客户端 |

### 页面级组件

| 组件 | 用途 |
|------|------|
| TagFilter | 首页标签筛选 |
| ArticleTimeline | 左栏文章列表 |
| TableOfContents | 右栏 TOC |
| SearchBox | Pagefind 全站搜索 |
| DarkToggle | 暗色模式 |
| **Studio** 🆕 | AI 知识库问答（密码保护） |

---

## 5. UI/UX 设计系统

### 色彩

| 用途 | 类名 |
|------|------|
| 主文字 | `text-zinc-900` |
| 副文字 | `text-zinc-600` |
| 辅助 | `text-zinc-500` / `text-zinc-400` |
| 强调 | `text-blue-600` |
| 背景 | `bg-white` |
| 次级背景 | `bg-zinc-50` |
| 边框 | `border-zinc-100` |

❌ 禁用 `gray-*` 色系。❌ 禁用实线粗边框。

### 质感

- 毛玻璃导航：`backdrop-blur-xl bg-white/70`
- 卡片：`rounded-2xl border border-zinc-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`
- 悬浮气泡：`rounded-2xl bg-white/80 backdrop-blur-2xl`
- 所有交互元素必须有 `transition-all duration-300 ease-out`

### 暗色模式

全局 `dark:` Tailwind 变体，body 切换 `dark` class。所有组件必须覆盖暗色变体。

---

## 6. 组件架构模式

**React 组件（`*.tsx`）**：交互逻辑。`"use client"`。
**Astro 包装器（`*Wrapper.astro`）**：加 `client:load`。

```
src/components/
├── FooBar.tsx           ← React 核心
├── FooBarWrapper.astro  ← Astro 包装 + client:load
```

MDX 中导入包装器，不直接导入 `.tsx`。

---

## 7. 标签体系

`src/data/tags.ts` 三级层级：

- **一级**：`coding` / `life` / `thinking`
- **二级**：`python` / `frontend` / `webdev` / `ai` / `knowledge` / `methodology`
- **三级**：`litestar` / `astro` / `react` / `probability` / `statistics` / `philosophy` / `history` / `decision-making`

---

## 8. Studio AI 问答

- 页面 `/studio`，密码 `[redacted]`（SHA-256 校验）
- 构建时 `readdirSync` 扫描 `src/pages/*.mdx` 自动索引
- 客户端 bigram 匹配 Top 5 → DeepSeek 注入上下文回答
- API key：GitHub Secrets `PUBLIC_DEEPSEEK_API_KEY`

---

## 9. 文章注册

每新增 `.mdx` 必须在 `src/data/articles.ts` 注册：

```ts
{
  href: "/astro-wiki/08-new-article",
  title: "新文章标题",
  description: "一句话简介",
  date: "2026-06-XX",
  tags: ["thinking", "methodology"],
}
```

注册后自动出现在：首页列表、左栏时间线、标签弹窗、Studio AI 索引。

---

## 10. 禁止操作

| 操作 | 原因 |
|------|------|
| 新建笔记不用 ArticleHero | 破坏视觉一致性 |
| MDX 中 JSX 标签内断行 | MDX 将换行视为段落边界 → 编译报错 |
| 直接导入 `.tsx` 到 MDX | 无 `client:load` → 交互失效 |
| 用内联 `style` | 不受暗色变体控制 |
| 使用 `gray-*` 色系 | 统一用 `zinc-*` |
| 实线粗边框 | 破坏极简美学 |

---

> 📖 **AI 须知**：编写代码前阅读本文件。编写笔记前额外阅读 `NOTE_WRITING_GUIDE.md`。
