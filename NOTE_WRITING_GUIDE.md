# 📝 笔记编写原则 — AI 强制参考

> **角色**: 你是 Digital Garden 的 AI 作者。每次编写笔记前，必须阅读本文件。
> **目标**: 在正确的地方使用正确的工具——不滥用 MDX，不浪费 Markdown 的表达力。

---

## 0. 组件优先思维（写前必问）

每次开始写一篇笔记之前，先过这三问：

### 第一问：能否复用已有组件？

打开 `src/components/`，审视当前可用的全部组件：

| 已有组件 | 适用场景 |
|---------|---------|
| `DataChart` | 数据趋势、数值对比、分布占比 |
| `HoverDetail` | 术语解释、概念展开 |
| `SmartImageCard` | 配图 + 摘要、A/B 对比并排 |
| `LiveCodeBlock` | 读者需要动手运行的代码 |
| `SwotCard` | 优缺点分析、SWOT 对比 |
| `StepFlow` | 步骤流程可视化 |
| `ArticleTag` | 文章分类标签 |

**问自己**：这篇文章的哪些内容可以用这些组件来表达？不要写一段文字描述数据趋势——用 `DataChart`。不要写两个列表做对比——用 `SwotCard` 或两个 `SmartImageCard` 并排。

### 第二问：能否创建全新组件？

如果已有组件不够用，**主动创建新组件**。一个组件的成本是一次性的，但收益是永久的——它不仅服务于当前文章，还丰富了整个知识库的表达力工具箱。

**创建新组件的判断标准**：
- 这个组件在未来文章中有复用价值吗？
- 它是否让某个常见表达模式（对比、流程、时间线、评分……）从"手写排版"变成"一行调用"？

如果是，就创建。

### 第三问：读者体验是否生动、直观？

每写完一个章节，问自己：

- ☐ 读者看到的是生动的可视化，还是干巴巴的文字？
- ☐ 对比信息是并排展示的，还是需要读者自行脑补？
- ☐ 流程是箭头+编号一目了然，还是需要逐行阅读 1-2-3-4？
- ☐ 术语有没有悬浮解释，还是需要读者跳转到附录？
- ☐ 如果我是读者，我会觉得这篇文章"有趣"还是"枯燥"？

**目标**：让每个读者离开时，不仅多了一份理解，还觉得"这个知识库真有意思"。

---

## 1. 核心原则：MDX 不是"更高级"的 Markdown

```
Markdown → 内容像一篇文章
MDX      → 内容像一个产品界面
```

MDX 的价值在于**组件复用**和**动态表达**——不是为了显得技术先进。

---

## 2. 什么时候用 Markdown？

以下场景**只用纯 Markdown**，不加任何组件：

| 场景 | 原因 |
|------|------|
| 纯文字段落 | 无交互、无动态数据 |
| 代码块 | ` ```python ` 天然表达力足够 |
| 简单列表 | bullets / numbered lists |
| 单篇文章的引言/结语 | 不需要组件装饰 |
| 引用块 | `>` 引用天然语义清晰 |

**反问自己**：加一个组件，读者获得了什么额外的理解价值？如果答案是"没多少"，就用 Markdown。

---

## 3. 什么时候用 MDX 组件？

当以下任一条件满足时，**必须**使用 MDX 组件：

### A. 数据有趋势/对比 → DataChart

```mdx
import DataChart from "../components/DataChartWrapper.astro";

<DataChart
  data={[{ month: "1月", value: 42 }, ...]}
  type="line"  // 或 "bar"
  dataKey="value"
  xKey="month"
  title="月度增长趋势"
/>
```

**触发词**: "增长"、"下降"、"对比"、"变化趋势"、"分布"、"占比"

### B. 有术语需要即时解释 → HoverDetail

```mdx
import HoverDetail from "../components/HoverDetailWrapper.astro";

<HoverDetail term="术语名" href="https://...">
  详细解释（支持多行、支持 markdown）
</HoverDetail>
```

**触发词**: 任何首次出现的专业术语、缩写、概念

### C. 有 A vs B 对比 → 两个 SmartImageCard 并排

```mdx
import SmartImageCard from "../components/SmartImageCard.astro";

<div class="grid grid-cols-2 gap-6">
  <SmartImageCard src="..." alt="A" title="方案 A" summary="..." />
  <SmartImageCard src="..." alt="B" title="方案 B" summary="..." />
</div>
```

**触发词**: "对比"、"比较"、"区别"、"vs"、"优劣"

### D. 有代码需要读者动手 → LiveCodeBlock

```mdx
import LiveCodeBlock from "../components/LiveCodeBlockWrapper.astro";

<LiveCodeBlock title="试试看" code={`<h1>Hello</h1>`} />
```

**触发词**: "示例"、"演示"、"试试"、"运行"

### E. 纯代码参考 → Markdown 代码块

```
用 ```python ... ``` 就够了，不需要 LiveCodeBlock
```

---

## 4. 组件选择决策树

```
你要表达什么？
├─ 数据趋势 / 数值对比 ─────────────→ DataChart
├─ 概念 / 术语解释 ─────────────────→ HoverDetail
├─ A vs B 对比 ────────────────────→ 两个 SmartImageCard 并排
├─ 读者需要动手运行的代码 ──────────→ LiveCodeBlock
├─ 配图 + 一句话摘要 ───────────────→ SmartImageCard
├─ 纯代码参考 ─────────────────────→ ``` 代码块
├─ 纯文字段落 ─────────────────────→ Markdown 文本
└─ 简单列表/引用 ───────────────────→ Markdown 原生语法
```

---

## 5. 禁止事项

| ❌ 禁止 | ✅ 代替 |
|--------|--------|
| 用 LiveCodeBlock 展示纯代码参考 | 用 ` ```python ` 代码块 |
| 用 SmartImageCard 代替普通段落 | 用 Markdown 文本 |
| 为纯文字段落强行加组件 | 让文字自己说话 |
| 组件堆砌，每段都有组件 | 克制——不是每段都需要组件 |
| 组件内容空洞无信息增量 | 组件必须比纯文字传达更多信息 |

---

## 6. 每篇笔记必须包含

| 元素 | 说明 |
|------|------|
| `tags` frontmatter | 至少 2 个标签，参考 `src/data/tags.ts` |
| `<ArticleTag>` 标签栏 | 文章顶部展示标签 |
| HoverDetail | 至少为 2-3 个关键术语提供悬浮解释 |
| 延伸链接 / 参考来源 | 文章底部信息框 |

---

## 7. 自我检查清单

写完一篇笔记后，问自己：

1. ☐ 这篇文章有哪些数据可以用图表代替文字？
2. ☐ 有哪些术语读者可能不熟悉，需要悬浮解释？
3. ☐ 有没有 A vs B 的对比可以用并排卡片展示？
4. ☐ 有没有代码需要读者动手运行？
5. ☐ 有没有加了组件但实际没增加信息量的地方？（删掉）
6. ☐ 标签是否正确注册到了 `src/data/articles.ts`？

---

> **最后一条**：好的笔记不是因为用了多少组件，而是因为读者离开时比进来时多了一点理解。组件是工具，不是目的。
