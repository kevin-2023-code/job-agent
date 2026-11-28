# job-agent

开源求职技能包，装进你已经在用的 AI agent 就能用：Claude Code、Codex、Cursor、VS Code / GitHub Copilot、Gemini CLI、Windsurf、OpenCode。

告诉它你想找什么，它会：找出值得投的岗位，按你的目标逐个打分；改简历，但不编造任何内容；按你的设置在公司官网投递（由 agent 提交，或填好停在提交按钮前等你）；维护投递记录；找能帮你内推的人；再帮你准备接下来的面试，每天针对你的薄弱点刷题。

[English](README.md)

## 安装

复制一行到终端里回车，中途不需要你回答任何问题。

**Windows**：打开 **PowerShell**（开始菜单里输入 PowerShell 回车），粘贴：

```powershell
irm https://raw.githubusercontent.com/kevin-2023-code/job-agent/main/install.ps1 | iex
```

**macOS / Linux**：打开 **终端（Terminal）**，粘贴：

```bash
curl -fsSL https://raw.githubusercontent.com/kevin-2023-code/job-agent/main/install.sh | sh
```

已经装了 Node.js 18+ 的话，任何系统都可以用这一行：

```bash
npx -y github:kevin-2023-code/job-agent install
```

它会找到你电脑上所有的 AI agent（Claude Code、Codex、Cursor、VS Code / Copilot、Copilot CLI、Gemini CLI、Windsurf、OpenCode），给每个都装上技能、连上 TrueInterview，并打开登录页。装完会告诉你下一步运行哪一行，比如：

```bash
claude "set me up"
```

agent 会先确认你已登录（新用户在同一个页面注册免费账号），然后读取你的简历，把它推断不出来的问题一次问完，再把简历和投递偏好保存到你的 TrueInterview 账号。之后你的任何改动（改了简历、换了偏好、投出了申请）都会在工作流程中自动上传。

- 只用自己的数据、不连 TrueInterview：PowerShell 先运行 `$env:JOB_AGENT_ARGS="--local"`，终端用 `curl … | sh -s -- --local`。
- 卸载：`npx -y github:kevin-2023-code/job-agent uninstall`（个人文件会保留）。
- 也可以用各 agent 自带的插件系统安装，见英文 README。

## 两种模式

**默认连接 TrueInterview，不会先问你**。不连也能用全部功能：

- **连接模式**：登录 TrueInterview MCP 后，agent 能拿到按你匹配度排序的跨公司实时岗位；每家公司真实的面试流程、考点和近期被问到的题；匹配度评分；你的简历和常用表单答案；对每份申请表逐项读取并用你的资料作答；以及和网站同步的投递记录。免费账号就能用。
- **本地模式**：不登录也能用。所有功能都基于你自己的文件：简历、偏好、`knowledge/` 文件夹里的面试笔记和调研，以及你列出的公司在 Greenhouse、Lever、Ashby、SmartRecruiters 上的公开招聘页。

agent 会自己判断当前是哪种模式，不会因为没连服务就停下来。

**遇到不确定的内容，它会先查，而不是猜或者直接问你**。比如申请表里答不上的字段、关于你的某个信息、某家公司怎么面试：连接模式下，它会先查 TrueInterview 上你保存的答案、简历、笔记、以前的对话和这家公司的面试记录，再查本地文件；都查不到才问你，而且只问一次，答案会保存下来，之后的表单不会再问。

## 配合 Muse、千问、Manus 等使用

聊天类和桌面类 agent 没有技能文件夹，所以 job-agent 给每个 agent 准备**一段设置消息**：连上 TrueInterview，带上规则和完整的运行流程（和 `job-run` 技能同一份内容，由它自动生成），并按你选的时间建一个每日定时任务。你的设置保存在 TrueInterview 账号上，之后改设置不需要重新发消息。

- 每个 agent 的步骤：[`agents/`](agents/README.md)（Meta Muse、Manus、Grok、千问办公、WorkBuddy、其他 MCP agent）。
- 连接：支持 MCP 登录的 agent 直接登录；其他的在 [trueinterview.io/agent/start](https://trueinterview.io/agent/start) 为这个 agent 生成一把 key（只显示一次），填进 agent 的连接器或凭据设置，不要发在聊天里。
- 设置消息：`job-agent agent qwen --message --time 9:00am` 打印，或从对应页面复制。
- 在 TrueInterview 上选择投递方式：**全自动**、**先给我挑**（把挑中的岗位加进待投清单并写明理由，你批准后才投）、**只投我加的**；谁来提交（agent 或你自己）；最低匹配分；每天最多投几个。每次运行都会先读这些设置。

## 刷题与练习

`job-practice`：按优先级告诉你下一步练什么（到期复习、你在投公司的高频题、你的薄弱题型），只给提示不直接给答案，做限时模拟面试（算法、系统设计、OOP、SQL、AI coding），并记录你错在哪里，下次重点练。连接模式下题目来自 TrueInterview 题库，附练习链接。

## 不会做什么

- 不编造你的任何经历。
- 除非你设置了由 agent 提交，否则不替你点最后的提交；不发邮件，不联系任何人，只起草，发送由你来。
- 不替你登录、不注册账号、不碰密码、不做验证码。
- 不回答身份类自愿披露问题，除非你设置了"一律选择不披露"。

自动填表需要 agent 带浏览器工具，各 agent 的一行配置见 [`docs/browser.md`](docs/browser.md)。没有浏览器工具时，会给你一份答案单，复制粘贴即可。

## 你的文件

都在 `~/job-agent/`：简历和偏好（`profile/`）、知识库（`knowledge/`）、关注的公司（`portals.yml`）、本地投递记录（`data/`）、岗位评估（`reports/`）、生成的简历、答案单和备考计划（`output/`）。

`knowledge/` 是越用越值钱的部分：以前的面试笔记、工作成果记录、绩效评价、朋友讲的团队情况。不管哪种模式，回答公司或你个人经历相关的问题前，agent 都会先搜这里。

## 许可

MIT
