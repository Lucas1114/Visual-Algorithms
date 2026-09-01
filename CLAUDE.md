# Visual-Algorithms — 重构工作说明

> **开发笔记 / session 交接记录在本地 `HANDOFF.md`（不提交）。每个新 session 先读本文件，再读 `HANDOFF.md`。**
> 本文件按「可以给面试官看」的标准写 —— 不要往里加内部吐槽、个人信息、session 流水账、或关于仓库公开呈现的 meta 决定，那些进 `HANDOFF.md`。

## 项目背景

这是 2021 年用纯 vanilla JavaScript + SVG 手写的算法可视化项目，包含三个算法的交互式动画讲解。原始代码没有任何框架，没有构建工具，依赖 jQuery + fullPage.js。

**这次重构的目标**：迁移到 React + TypeScript + Vite，部署到 Vercel，作为作品集展示。后期加一个薄的 Spring Boot 后端做配置分享。

**重要**：原始代码的 commit 历史（2020-2021）是这个项目价值的一部分 —— 它证明了这些动画是在 AI 辅助编程出现之前手写的。这段历史一个字节都不要动：不 rebase、不改写、不重建仓库。迁移工作在独立分支上正常提交，最后一次 squash-merge 并入 `main`（见「Git 工作流」）。

## 三个算法

| 目录 | 算法 | 难度 | 优先级 |
|---|---|---|---|
| `KMP/` | Knuth-Morris-Pratt 字符串匹配 | 低 | 第一阶段 |
| `Manachar/` | Manacher 最长回文子串 | 中 | 第二阶段 |
| `Hare&Tortoise/` | Floyd 判圈（快慢指针） | 高 | 第三阶段 |

**严格按顺序做，一次只做一个。** 第一阶段的产出包含一套共享组件，后两个是往这套骨架上填。不要三个并行开工。

## 核心迁移原则

### 1. 算法逻辑原样保留

`kmp_pmt()`、`palindrome()` 这些纯计算函数是这个项目的核心资产，**逻辑一行都不要改**，只加 TypeScript 类型。如果你认为某处算法有问题，先停下来问，不要自己改。

### 2. 从「命令式画图」改成「状态驱动渲染」

原代码的模式是：清空容器 → 循环调用 `build_string()` 逐个 `createElementNS` 塞进 SVG。

```js
function reset(){ document.getElementById('rp_1').innerHTML='' }
```

这其实已经是 immediate-mode rendering 了，跟 React 的心智模型一致。迁移方式是把每个视图函数变成一个组件：

```tsx
function PmtView({ pat, nxt }: { pat: string; nxt: number[] }) {
  return <g>{pat.split('').map((c, j) => <Cell key={j} char={c} /* ... */ />)}</g>;
}
```

`build_string` / `build` / `build_center` 这几个几乎一样的函数，统一成一个 `<Cell>` 组件。

### 3. 动画：预计算帧 + CSS transition

原代码用多层嵌套 `setTimeout` 加逐帧 `setInterval` 改 `transform`。这套在 React 里不能照搬（组件重渲染时 timer 会失控），必须重写。

好消息是原作者已经把结构拆好了。KMP 的 `Animation()` 里：

```js
var rec=[0]   // 每一步 text 指针位置
var sgn=[0]   // 匹配 or 回退
var back=[0]  // 回退到哪
```

这三个数组就是预计算好的帧序列。统一改成：

```ts
type Frame = { /* 这一步的完整可见状态 */ };
const frames: Frame[] = useMemo(() => runAlgorithm(input), [input]);
const [step, setStep] = useState(0);
```

- 手动单步 = `setStep(s => s + 1)`
- **后退 = `setStep(s => s - 1)`**（原代码里 H&T 那一大坨 `step_back()` 跨阶段回滚逻辑可以整个删掉）
- 自动播放 = `useEffect` 里一个 interval，卸载时清理

位移动画全部交给 CSS：

```tsx
<g style={{ transform: `translateX(${pos * SIDE}px)`, transition: 'transform .5s' }}>
```

`tp_move` / `pp_move` / `pattern_move` / `preprocessing` 里那些逐帧 setInterval（每个约 30-40 行）全部删除。

### 4. 布局计算抽成纯函数

原代码里的坐标计算散在各处，且大量硬编码魔数（`x+170`、`y+100+2*side_len+20`、`fx+625` 等）。抽成 `layout.ts` 里的纯函数并定义常量。Manacher 的极坐标计算（`x-200*Math.cos(interval*(i-cycle))`）也一样，抽出来后可以单测。

## 各阶段具体任务

### 第一阶段：脚手架 + KMP

**脚手架**
- Vite + React 19 + TypeScript（原计划 React 18；2026-09 初始化时 Vite 官方模板已默认 React 19，迁移心智模型不变，故直接采用 19）
- 不要引入 UI 框架、不要引入动画库（framer-motion 等），CSS transition 足够
- 删除 jQuery、jQuery UI、fullPage.js。全屏滚动效果用 CSS `scroll-snap` 实现（fullPage.js 是 GPLv3/商业双授权，去掉更干净）
- ESLint + Prettier + `strict: true`

**共享组件**（后两个阶段复用）
- `<Cell>` — 带边框的方格 + 居中文字，支持 fill/stroke/dash/transform
- `<Arrow>` — 指针箭头 + 标签（原 `arrow()` 函数，注意它用 `points.getItem(i)` 逐点改坐标，改成直接算 points 字符串）
- `<StepController>` — 前进/后退/播放/重置，管理 `step` state
- `<AlgorithmLayout>` — 左侧 tab 菜单 + 右侧画布

**KMP 页面**
- 四个 tab：Introduction / Pre-Suffix / PMT / Animation（原 `build_button` 那 100+ 行手写 hover 和选中态，用 CSS 实现，只留十几行 JSX）
- 四个视图对应四个组件，从 `generate()` / `pre_suf()` / `pmt()` / `Animation()` 翻译
- 已知 bug 必须修复：`rec` / `sgn` / `back` 是全局数组且只 push 不清空，**重复点击 Animation 会导致动画错乱**。改成 useMemo 后自然消失。

### 第二阶段：Manacher

- 主体动画迁移方式同 KMP
- `step3()` 的翻转（flip）：每个格子的目标位置是纯函数 `targetX = (2*C - i) * SIDE`，直接交给 CSS transition，删掉那 200 帧的 setInterval
- **流程图不要一比一迁移，重画。** 原 `draw_flowchart()` 有 27 个 block + 一堆 `direction()` 箭头，坐标全是 `fx+625, fy+770` 这类魔数，文本是拼接的 `<tspan>` 字符串，共约 600 行。改成数据驱动：

```ts
const FLOW_NODES = [{ id: 18, text: '...', pos: {...} }, ...];
const FLOW_EDGES = [{ from: 5, to: 11, label: '' }, ...];
```

  `fc_track` / `fc_process` / `di_process` 三个高亮函数 → 一个 `activeNodeId` state。
- **已知死代码**：`stepforward()` 的 `case 7` 里 `step_cnt=14`，导致 `step8()` 到 `step13()` 永远不会被触发。那部分（约 200 行）是「为什么不需要比较翻转子串外的元素」的证明动画，内容上是 Manacher 最难讲清楚的地方。**先按现状迁移，把这部分接回去作为独立任务，做完主体后再动。**

### 第三阶段：Hare & Tortoise

- 拖拽条（`eventHandler`）：改成 `<input type="range">` 或 React 受控拖拽。**注意原代码 bug**：`case "mousedown"` 里赋值 `tmpX` / `mouseX`，但顶部声明的是 `tmpY` / `mouseY`，前两个是隐式全局变量，strict 模式会报错
- 链表 + 环的极坐标布局抽成纯函数
- 双向单步：原 `step_back()` 里跨阶段回滚（从「兔降速为 1」退回「相遇时刻」，还要恢复 `merge_cx` / `merge_cy` 坐标）整个删掉，由 `frames[step-1]` 天然支持
- `track_draw()` 的五个 case 推导图：数据驱动重画，同 Manacher 流程图的做法

### 第四阶段：Spring Boot 后端（可选，待定）

一个 endpoint + 一张表，保存「算法 + 输入字符串 + 选中的中心点」，返回短链。前端做 URL 状态序列化。做之前先跟我确认设计。

## Git 工作流

这个仓库的 commit 历史本身是作品集的一部分（会有人点进来看重构过程），所以提交要专业、粒度合理：

- **多次提交，一次推送。** 按重构的自然结构切分 commit（一个逻辑改动一个 commit：改名、脚手架、某个共享组件、某个视图……），攒够一批（大概 5-6 个）或一个小阶段告一段落，再一次性 `git push`。不要一个巨型 commit，也不要每改一行就 push。
- commit message 写清楚「改了什么、为什么」，用英文，遵循仓库既有风格。
- 每个大阶段（KMP / Manacher / H&T）完成时必定推一次。
- **`main` 上 2020-2021 的原始 commit 一个字节不动** —— 不 rebase、不改写、不 force-push 已发布的历史。迁移工作在 `react-migration` 分支进行，全部完成后**一次 squash-merge 并入 `main`**，压成一组精心组织的 commit（改名 / 脚手架 / 共享组件 / KMP / Manacher / H&T / 部署 / About），随后删除迁移分支。这一步是既定方案，与上面「保留原始历史」不冲突。
- push 前先 `npm run lint` + `npx tsc -b` + `npm test` + `npm run build` 全绿。

## 部署

**时序（用户 2026-09-01 定）**：先做完 Manacher，再做完 Hare & Tortoise，**三个算法都迁移完之后**，才一起做部署 + About 页。不要提前搭部署（before/after 对比表要三个都在才完整）。

- Vercel 连 GitHub 仓库，push 自动部署。Root Directory 设 `app/`，framework 选 Vite。`app/vercel.json`（SPA rewrite）已就位。
- 保留原有的三个算法子路径（`/kmp`、`/manacher`、`/floyd`），旧链接尽量不要死
- **新旧站同时部署，一个 URL**（用户要这个，用来证明旧版是 AI 时代之前手写的）：
  - 方案：一个 Vercel 部署，`vite build` 后用一个小构建脚本把仓库根的 2021 文件（`index.html` / `KMP/` / `Manachar/` / `hare-tortoise/` / `dist/` / `imgs/` / `examples.js`）复制进 `dist/legacy/`。旧文件继续留在仓库根不动，只构建时拷贝。
  - 结果：`域名/` = React 新版，`域名/legacy/` = 原样 2021 版
  - 互链：新版首页一句 "See the original 2021 version →"；旧版 `index.html` 顶部加 banner 链回 `/`
- **About 页**（React `/about` 路由，三个算法都完成后做）：引言（2021 手写 / 2026 AI 重构）+ before/after 对比表 + 链到 `/legacy/` + 链到 GitHub 仓库。provenance 证据：同仓库里 2020-2021 的原始 commit 原封不动，2026 重构是叠在其上的一组 commit。

## 其他

- ~~原 `index.html` About 页有明文邮箱会被爬虫扫~~ 已删除（2026-09-01，那是用户不再使用的学校 alumni 邮箱，直接去掉整行；以后联系方式走 LinkedIn，等 React About 页做的时候加链接，需要用户给 URL）
- README 里写清楚：2021 年原始实现为纯手写 vanilla JS + SVG，2026 年迁移至 React + TypeScript。原始 commit 历史保留在同一仓库
- 每个阶段做完先跑起来给我看效果，不要一口气做完三个
- 项目 / 部署完成后的收尾清单（面试笔记、Git 历史清理等）见 `HANDOFF.md`

## 沟通方式

- **每次开新对话，第一件事用 `set_session_title` 给会话命名**，格式 `阶段N：简述`（如 `阶段一：KMP 动画 tab`、`阶段二：Manacher 流程图`、`杂项：修 Vercel 部署`），方便日后按阶段检索同一项目的多个对话。对话范围明显变化时再改一次名。
- 遇到「原代码逻辑看不懂」或「疑似 bug」，停下来问，不要自行推断后改掉
- 技术解释先给一个简单具体的例子，再讲抽象原理
- 需要我理解某段陌生代码的流程时，用 function 粒度的流程图（一个函数一个节点）
- 目录 `Hare&Tortoise/` 改名为 `hare-tortoise/`。`&` 在 shell 和 URL 中是特殊字符，原 index.html 里的 `href="Hare&Tortoise/..."` 本身也不规范。用 `git mv` 改名以保留文件历史
  - 已完成（2026-09-01）：`git mv Hare&Tortoise/ hare-tortoise/`，三个文件（`.css`/`.html`/`.js`）一并改名，文件名内部的 `Hare&Tortoise.*` 暂保持不变（React 迁移阶段会整体替换）。`index.html` 的 `href="Hare&Tortoise/..."` 已更新为 `href="hare-tortoise/..."`；`KMP/KMP.html`、`Manachar/Manachar.html`、`hare-tortoise/Hare&Tortoise.html` 里指向 `../Hare&Tortoise/...` 的侧边栏交叉链接也一并更新。原因：`&` 在 shell 里是后台执行符、在 URL 里是 query 分隔符，裸写会导致链接和命令行操作出错。

## 进度

- [x] 第一阶段：脚手架 + KMP（2026-09-01，四个 tab 全部可用）
- [x] 第二阶段：Manacher（2026-09-01，主体动画 + 数据驱动流程图 +
  「为什么不用比翻转子串外的元素」证明动画全部完成）
- [x] 第三阶段：Hare & Tortoise（2026-09-01，两阶段 Floyd 走查 + 沿环弧动画 +
  距离等式推导图；ρ 建模成后继函数跑教科书 Floyd，输入字母串 + 点选环入口）
- [x] 部署 + About 页（2026-09-02，同一 Vercel 部署：`/` React 新版、`/legacy/`
  原样 2021 版，构建脚本按需拷旧文件；`/about` 路由讲 before/after + provenance；
  首页卡片走查缩略图由 `npm run thumbnails` 脚本生成）
- [ ] 第四阶段：Spring Boot 后端（待定）
