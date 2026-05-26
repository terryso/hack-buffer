---
layout: post
title: "BMad v6.8：AI开发正式进入"锁定意图"时代"
description: "BMad v6.8 引入 bmad-spec 意图合约、bmad-ux 双脊柱设计、bmad-investigate 工程化取证，从"让 AI 写代码"进化到"让 AI 准确理解你要什么"。"
date: 2026-05-26 10:00:00 +0800
categories: [AI, BMAD, 开发效率]
tags: [BMAD, BMad Method, Claude Code, 意图合约, AI开发]
---

AI 辅助开发的最大瓶颈，从来不是 AI 不会写代码——而是它没搞懂你到底要什么。

过去七周，BMad 连续发布了从 v6.3 到 v6.8 的七个版本。如果用一句话概括这波更新的核心方向，那就是：**从"AI帮你干活"进化到"AI先锁定你的真实意图，再干活"。**

<img src="https://terryso.pages.dev/1AD74379-281F-4DBC-9F2A-2A151A4EF5F0/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2010_06_17.png" alt="BMad v6.8 意图锁定时代" style="max-width: 100%; height: auto; display: block; margin: 20px auto;">

## 三个核心能力，重新定义"需求理解"

### bmad-spec：把模糊想法变成结构化意图合约

`bmad-spec` 是 v6.8 引入的核心技能。它做的事情听起来简单，但影响深远：

> 把任何输入——脑暴记录、PRD、对话记录、产品简报——提炼成一个五字段的 **SPEC.md** 内核。

这五字段不是随意拼凑，而是专门为下游的架构设计、故事拆分和开发实现优化的。换句话说，`bmad-spec` 的输出不是给人看的总结，而是给**后续所有 AI 技能消费的合约**。

它取代了之前的 `bmad-distillator`，但定位完全不同：不是"蒸馏信息"，而是"锁定意图"。

这意味着什么？意味着你的 PRD 可以改、对话可以跑偏、脑暴可以发散——但只要 `bmad-spec` 生成了 SPEC.md，后续所有工作流都锚定在这份合约上，不会因为上游的变化而丢失焦点。

### bmad-ux：视觉与行为双脊柱，不再是"画个页面"

v6.8 对 `bmad-ux` 做了彻底重写（breaking change），用两份文档替代了原来的 `bmad-create-ux-design`：

- **DESIGN.md**：基于 Google Labs 规范的视觉设计定义
- **EXPERIENCE.md**：行为流程与交互状态描述

这不是把一个文档拆成两个文件那么简单。"双脊柱"架构解决的是一个真实痛点：**视觉设计和交互行为本质上属于不同的关注维度，强行塞在一份文档里，必然互相干扰。**

新方案还引入了"具名主角旅程"（Named-protagonist journeys）——不再是抽象的"用户"，而是有名字、有场景、有行为链的具体角色。这让 UX 输出从"设计稿描述"变成了"可验证的行为规范"。

### bmad-investigate：用工程化方式解决问题，而不是拍脑袋

`bmad-investigate` 带来的是一种全新的问题分析范式：

> 不是"我觉得 bug 在这里"，而是生成带有**证据等级**的法医级分析报告。

它适用三种场景：

1. **Bug 排查**：收集证据、标记置信度、给出分级结论
2. **根因分析（RCA）**：追溯到问题源头，而不是停留在表面症状
3. **陌生代码探索**：面对不熟悉的代码库，用结构化方式建立理解

每条发现都带有置信度评级，让审查者清楚知道"这个结论有多靠谱"，而不是面对一堆模糊的猜测。

## 不只是三个新技能：平台级的进化

v6.8 的意义远不止上面三个技能。过去七周的更新里，有几个变化值得特别关注：

**意图导向的规划技能全面重写（v6.7）**
`bmad-prd` 和 `bmad-brief` 被彻底重写，统一为 Create / Update / Validate 三种意图模式，支持 Fast 和 Coaching 两种节奏，输出会根据项目规模自适应调整。`bmad-prd` 成为唯一的 PRD 技能，旧的 PRD 技能自动路由到它。

**19 种新引导技术（v6.8）**
从六顶思考帽、德尔菲法到钢铁侠论证，引导技术库从 50 种扩充到 69 种。这不是堆数量，而是让 AI 在不同场景下能选择合适的思维框架来引导需求讨论。

**TOML 定制化（v6.4）**
每个 Agent 和工作流都可以通过 `_bmad/custom/` 目录下的 TOML 文件定制，不再需要 fork 整个项目。配合 `bmad-customize` 技能，定制过程变成了交互式引导。

**42 个 Agent 平台支持（v6.5）**
新增 18 个平台，包括 Sourcegraph Amp、IBM Bob、Warp、OpenHands、Replit Agent 等。BMad 不再只是 Claude Code 的专属工具。

**Web Bundles：不用 IDE 也能用 BMad（v1.0）**
这是一个重要的里程碑——BMad 的规划技能被打包成 Google Gemini Gems 和 ChatGPT Custom GPTs，覆盖头脑风暴教练、产品简报教练、PRD 教练、UX 教练等六个场景。不写代码的人也能进入 BMad 生命周期，而且输出的 artifact 与 IDE 技能完全兼容。

## 为什么说这是"锁定意图"时代

回顾 BMad 的演进路径：

- **早期**：让 AI 模拟敏捷团队的角色（v1-v5）
- **中期**：让 AI 自动编排开发流程（v6.0-v6.2, Story Automator）
- **现在**：让 AI 在动手之前，先准确理解你要什么（v6.3-v6.8）

`bmad-spec` 提炼意图合约，`bmad-ux` 把视觉和行为分开描述，`bmad-investigate` 用证据而非猜测来诊断问题——这三者共同指向一个方向：

> **AI 开发的核心瓶颈，已经从"怎么写代码"转移到了"怎么理解需求"。**

v6.8 的所有变化，都在围绕这个方向发力。当你下一次用 BMad 开始一个新项目时，你会发现整个流程变了：先锁定意图，再动手实现。这不是多了一个步骤，而是让后续所有步骤都建立在正确的基础上。

---

*完整更新日志：[BMad Update: Web Bundles for Gemini & ChatGPT, plus BMM v6.8.0](https://www.bmadcode.com/bmad-update-may-2026-web-bundles-prd-brief-platforms/)*
