---
name: git-commit-message
description: '自动分析暂存区与工作区改动，生成规范的中文 Git 提交信息并直接执行提交。生成格式为「英文 Conventional Commits 前缀 + 中文描述」，多主题改动会先给出分组暂存方案再逐条提交。USE FOR: 生成 commit 信息, 帮我提交, 提交改动, 写 commit, 生成提交信息, commit message, 拆分提交, 分组提交, git commit, 提交规范, 描述我的改动, stage 并提交, commit 暂存的改动, write a commit message, generate commit message, conventional commit, describe my changes, commit staged changes. DO NOT USE FOR: 创建 PR（用 GitHub 流程）, push 到远端, 解决 merge/rebase 冲突, 代码审查, 撤销已推送的提交。'
argument-hint: '可选：指定提交范围（如「只提交 source/_posts」）或强制 commit 类型'
user-invocable: true
disable-model-invocation: false
---

# Git 提交信息自动生成

分析当前仓库改动，生成规范的提交信息，并执行 `git commit`（**绝不 push**）。

## 何时使用

- 用户说「帮我提交」「生成 commit 信息」「提交这些改动」。
- 改动已完成、准备落盘，但还没想好怎么写提交信息。
- 想确认改动是否该拆成多条提交。

## 不适用

- 需要 push、建 PR、或处理分支冲突时 → 走对应流程。
- 需要撤销已推送的提交 → 用 `git revert` 单独处理。

## 规范

提交信息格式为 `<type>(<scope>): <中文描述>`。
完整的类型表、scope 表、拆分判断与反例见 [commit-conventions.md](./references/commit-conventions.md) —— **生成前先读它**。

## 流程

### 1. 收集上下文

运行收集脚本，一次拿到分支、暂存状态、未跟踪文件、完整 diff 和近期提交风格：

```bash
bash ./.github/skills/git-commit-message/scripts/collect-context.sh
```

脚本是只读的，不会修改仓库。

### 2. 判断是否有可提交内容

- 暂存、未暂存、未跟踪三者**全为空** → 告知「没有需要提交的改动」并停止。
- 只要有一项非空 → 继续。

### 3. 决定提交范围

| 暂存区状态 | 处理方式 |
|-----------|---------|
| 已有暂存内容 | **只提交已暂存的内容**，不动未暂存/未跟踪文件；末尾提示「另有 N 个文件未提交」 |
| 暂存区为空 | 基于未暂存 + 未跟踪改动，给出暂存方案后执行 |

### 4. 判断是否需要拆分

对照 diff 判断改动是否属于**同一主题**：

- 同一主题（如一篇新文章 + 其配图 + 相关索引更新）→ **合成一条**提交。
- 互不相关（如「新增文章」与「升级依赖」）→ **拆分**：
  1. 先输出分组方案（每组：主题 + 涉及文件 + 建议的提交信息）。
  2. **在此暂停，等待用户确认分组方案后再动手**。
  3. 确认后逐组 `git add <具体路径>`——**不要用 `git add -A` 跨组暂存**。
  4. 每组生成一条信息并提交，再做下一组。

用户否掉分组方案时，按用户的调整重排，再重复第 2 步确认。

### 5. 生成提交信息

- `type` / `scope` 从 [commit-conventions.md](./references/commit-conventions.md) 中选取。
- **默认带 scope**：按改动所在路径从 scope 表中取值，如 `feat(posts):`、`chore(deps):`、`ci:`。
- 仅当改动横跨多个 scope 且无主次之分时才省略 scope（写成 `feat: ...`）。
- 描述用中文动宾短语，≤50 字符，不加句号。
- 仅当「为什么这么改」无法从 diff 直接看出时才写正文；正文分条说明，每行 ≤72 字符。
- 破坏性改动 → 在 type 后加 `!`，并在正文写 `BREAKING CHANGE:`。

### 6. 执行提交

单条提交 → 直接执行，无需额外确认（用户已授权自动提交）。

拆分为多条 → **必须先经过第 4 步的分组确认**，再逐条执行。

单行信息：

```bash
git commit -m "feat(posts): 添加 LeetCode 33 题笔记及代码示例"
```

带正文时用 heredoc，避免引号转义问题：

```bash
git commit -F - <<'EOF'
fix(theme): 修正公式渲染导致的页面错位

MathJax 与主题自带的 rollup 插件同时改写 DOM，
改为在 rollup 之后再加载 MathJax。
EOF
```

### 7. 验证

- `git log -1 --stat` 确认提交内容与信息一致。
- `git status` 确认预期的文件已进入提交、无意外残留。
- 报告提交哈希与文件名列表。

## 约束

- **绝不执行 `git push`**，也绝不创建 PR。
- **绝不提交**被 `.gitignore` 忽略的产物：`public/`、`db.json`、`node_modules/`、`.deploy_git/`。
- 发现疑似密钥（`.env`、token、私钥）→ 停止提交并提醒用户。
- 不自行 `git add` 用户明确排除的路径。
- 用户已暂存内容时，不擅自扩大提交范围。
- **拆分多条提交前，必须获得用户对分组方案的确认**；单条提交可直接执行。
- 提交信息语言固定为「英文前缀 + 中文描述」，除非用户当次明确要求改语言。

## 质量检查清单

提交前逐条确认：

- [ ] `type` 是规范表中的合法值。
- [ ] 描述是中文、动宾结构、≤50 字符、无句号。
- [ ] 已按改动路径带上合适的 `scope`。
- [ ] 一条提交只包含一个主题。
- [ ] 拆分场景下已获得用户对分组方案的确认。
- [ ] diff 里没有构建产物、临时文件或密钥。
- [ ] 与最近提交的风格一致（参考脚本输出的「RECENT COMMIT STYLE」）。
- [ ] 没有执行 push。

## 输出格式

```
## 提交范围
已暂存 N 个文件 / 使用未暂存改动

## 分组（如需拆分）
1. 新增文章 — source/_posts/xxx.md
2. 依赖升级 — package.json

## 提交信息
feat(posts): 添加 LeetCode 33 题笔记及代码示例

## 执行结果
e909946  3 files changed, 120 insertions(+)
- source/_posts/2026-09-23-xxx.md
- ...

## 备注
另有 2 个文件未提交：...
```

## 失败处理

| 情况 | 处理 |
|------|------|
| 提交被 pre-commit hook 拒绝 | 展示 hook 输出，修复后重试；**不要**用 `--no-verify` 绕过，除非用户明确要求 |
| 提示 `user.email` / `user.name` 未配置 | 告知用户需先执行 `git config`，停止提交 |
| 出现 merge 冲突 | 停止，交由用户解决冲突后再提交 |
| diff 过大被脚本截断 | 用 `git diff --stat` 与 `git diff -- <path>` 按文件逐个查看 |
