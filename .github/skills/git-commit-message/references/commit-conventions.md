# Conventional Commits 类型速查（本仓库）

提交信息格式：

```text
<type>(<scope>): <中文简短描述>

<可选正文：为什么这么改，每行不超过 72 字符>
```

- `type`：英文小写，取值见下表。
- `scope`：可选，英文小写，见下表。
- `描述`：中文，动宾短语，结尾不加句号，不超过 50 字符。

## 类型

| type | 用于 | 本仓库示例 |
| ------ | ------ | ----------- |
| `feat` | 新增内容或功能 | `feat: 添加 LeetCode 33 题笔记及代码示例` |
| `fix` | 修复错误 | `fix: 修正公式渲染导致的页面错位` |
| `docs` | 仅文档改动 | `docs: 更新 README 部署说明` |
| `style` | 不影响逻辑的格式/排版 | `style: 统一文章标题格式` |
| `refactor` | 重构，行为不变 | `refactor: 抽取复制按钮逻辑为公共函数` |
| `perf` | 性能优化 | `perf: 延迟加载 Live2D 资源` |
| `chore` | 依赖、配置、杂项 | `chore: 升级 Hexo 依赖并更新 lockfile` |
| `ci` | CI / GitHub Actions | `ci: 添加博客自动部署工作流` |
| `build` | 构建脚本、打包 | `build: 调整 deploy.sh 构建步骤` |
| `revert` | 回滚某次提交 | `revert: 回滚 RSS 复制功能` |

## 常用 scope

| scope | 对应路径 |
| ------- | --------- |
| `posts` | `source/_posts/` |
| `theme` | `themes/hingle/` |
| `config` | `_config.yml`、`_config.*.yml` |
| `scripts` | `scripts/` |
| `ci` | `.github/workflows/` |
| `deps` | `package.json`、`package-lock.json` |

## 拆分与合并的判断

- **合并为一条**：同一主题的多个文件（如一篇新文章 + 其配图 + 首页更新）。
- **拆分为多条**：互不相关的改动（如「新增文章」与「升级依赖」应分开）。
- 拆分时按目录或主题分组，逐组 `git add <paths>` 后分别提交。

## 反例

- ❌ `update` / `修改` / `111` —— 无信息量。
- ❌ `feat: 添加牛客每日一题-小红的皇后题目及解题思路` —— 描述过长。
- ❌ `feat: 添加A，修复B，升级C` —— 一条提交混杂多主题。
