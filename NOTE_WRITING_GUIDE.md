# 📝 笔记编写原则 — AI 强制参考

> **角色**: 你是 Noösphere 的 AI 作者。每次编写笔记前，必须阅读本文件。
> **目标**: 用组件表达思想——文艺、玄深、简洁。

---

## 0. 笔记强制结构

每篇笔记必须遵循此结构，不可省略任何元素：

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

{/* ① 标签栏 */}
<div class="not-prose mb-8 flex flex-wrap gap-2">
  <ArticleTag tagKey="thinking" /> ...
</div>

{/* ② 头图 + 玄深图注（必须） */}
<ArticleHero
  src="https://images.unsplash.com/photo-XXXXX?w=1200&h=500&fit=crop"
  alt="描述"
  caption="一句玄深的图注。"
/>

{/* ③ 开篇 */}
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

正文内容...
```

### 图注写作原则

图注是文章的第一句话，必须：简洁、玄深、与主题形成诗意张力。不超过一行。

**范例**：
- "不确定性有形状。那个形状只有一个参数。"（对概率文章）
- "宇宙用了 138 亿年，才在某个角落里第一次看见了自己。"（对德日进文章）
- "智能并非降临——它从连接中渗出，像露水一样安静。"（对 AI 文章）

---

## 1. 组件优先思维

### 已有组件速查表

| 组件 | 适用场景 |
|------|---------|
| **ArticleHero** 🆕 | **每篇笔记必须**——头图 + 玄深图注 |
| `DataChart` | 数据趋势、数值对比、分布占比 |
| `HoverDetail` | 术语解释、概念展开 |
| `SmartImageCard` | 配图 + 摘要、A/B 对比并排 |
| `LiveCodeBlock` | 读者需要动手运行的代码 |
| `SwotCard` | 优缺点分析、SWOT 对比 |
| `StepFlow` | 步骤流程可视化 |
| `ArticleTag` | 文章分类标签 |
| **ProbabilityPlayground** 🆕 | 交互式泊松分布探索（概率相关文章可用） |

### 决策树

```
你要表达什么？
├─ 数据趋势 / 数值对比 ─────────────→ DataChart
├─ 概念 / 术语解释 ─────────────────→ HoverDetail
├─ A vs B 对比 ────────────────────→ 两个 SmartImageCard 并排 or SwotCard
├─ 读者需要动手运行的代码 ──────────→ LiveCodeBlock
├─ 配图 + 摘要 ────────────────────→ SmartImageCard
├─ 步骤流程 ──────────────────────→ StepFlow
├─ 概率分布探索 ───────────────────→ ProbabilityPlayground
├─ 纯文字段落 / 代码参考 ───────────→ Markdown 原生
└─ 文章开头 ──────────────────────→ ArticleHero（必须）
```

---

## 2. 语调与风格

Noösphere 的文章不是教程，不是技术博客。它们是**思想拓片**——从某个主题上拓印下来的深度思考。

| 要 | 不要 |
|----|------|
| 文艺、玄深、掷地有声 | 口语化、接地气 |
| 短句，多分段 | 长段落，啰嗦 |
| 举一反三，面向普适真理 | 只讲技术不谈意义 |
| 引用、比喻、哲学钩子 | 干巴巴的罗列 |
| "泊松分布不在乎士气" | "泊松分布有三个参数：λ、e、k!" |

---

## 3. 创建新组件的六条铁律

#### 铁律 1：不要用通用组件凑合

每个语义场景应有专属组件。不要用 DataChart 模拟 SWOT，不要用 SmartImageCard 冒充流程。

#### 铁律 2：先拆解参考设计，再写代码

```
□ 布局：并排/堆叠？几列？
□ 配色：色值分别是多少？
□ 字体层级：标题/副标题/描述各多大？
□ 间距：padding/margin/gap
□ 特殊元素：水印、徽章、分隔线？
```

#### 铁律 3：API 设计优先考虑调用方

属性名直观，语义独立的数据拆成独立属性。

#### 铁律 4：用 Tailwind 类名，不用内联 style

`bg-green-50 dark:bg-green-950` 而非 `style="background: #f0fdf4"`

#### 铁律 5：统一圆角

所有卡片 `rounded-2xl`，外卡内卡一致。

#### 铁律 6：描述缩进，区分主次

条目名顶格加粗，描述 `ml-4` 缩进 2em。

---

## 4. 禁止事项

| ❌ 禁止 | ✅ 代替 |
|--------|--------|
| 新建笔记不用 ArticleHero | 这是必须结构 |
| 图注写废话或过长 | 一句玄深，不超过一行 |
| 用 LiveCodeBlock 展示纯代码 | 用 markdown 代码块 |
| 为纯文字强行加组件 | 让文字自己说话 |
| 内联 style | Tailwind 类名 + dark: 变体 |
| 直接导入 .tsx | 导入 Wrapper.astro |

---

## 5. 每篇笔记检查清单

1. ☐ `ArticleHero` 头图 + 图注？
2. ☐ 至少 2-3 个 `HoverDetail` 术语解释？
3. ☐ 标签栏（`<ArticleTag>`）？
4. ☐ 注册到 `src/data/articles.ts`？
5. ☐ 图注是否玄深、简洁、有诗意张力？
6. ☐ 有没有可以用组件代替的文字段落？
7. ☐ 延伸阅读 / 参考来源？

---

> **最后一条**：好的笔记不是因为用了多少组件，而是因为读者离开时比进来时多了一层理解。组件是工具，思想是目的。
