# 项目依赖说明文档

这个文档记录了项目中所有依赖包的用途，方便日后维护和管理。

## 📦 核心依赖

### Hexo 核心

- **hexo** `^7.0.0` - Hexo 核心框架，博客系统的基础

### 部署相关

- **hexo-deployer-git** `^4.0.0` - Git 部署插件，用于部署到 GitHub Pages

### 生成器（必需）

- **hexo-generator-archive** `^2.0.0` - 归档页面生成器
- **hexo-generator-category** `^2.0.0` - 分类页面生成器
- **hexo-generator-index** `^3.0.0` - 首页生成器
- **hexo-generator-tag** `^2.0.0` - 标签页面生成器
- **hexo-generator-feed** `^3.0.0` - RSS/Atom 订阅源生成器

### 渲染器（必需）

- **hexo-renderer-ejs** `^2.0.0` - EJS 模板渲染器，渲染 .ejs 文件
- **hexo-renderer-marked** `^6.0.0` - Markdown 渲染器，渲染 .md 文件
- **hexo-renderer-stylus** `^3.0.0` - Stylus CSS 渲染器，渲染 .styl 文件

### 服务器

- **hexo-server** `^3.0.0` - 本地开发服务器，用于 `hexo server` 命令

## 🎨 主题相关

### 默认主题

- hingle 主题

## 🔧 功能插件

### 数学公式支持

- **hexo-filter-mathjax** `^0.7.1` - MathJax 数学公式渲染插件
  - 用途：在文章中显示数学公式
  - 配置：_config.yml 中的 mathjax 配置
  - **重要性**：如果文章中有数学公式，必需保留

### 性能优化

- **hexo-filter-optimize** `^0.3.1` - 资源优化插件
  - 用途：压缩和合并 CSS/JS 文件
  - 配置：_config.yml 中的 filter_optimize 配置
  - **注意**：已禁用 CSS 合并以避免壁纸样式丢失
  - **可选性**：可保留用于 JS 优化

## 🎭 Live2D 看板娘

### Live2D 核心

- **hexo-helper-live2d** `^3.1.1` - Live2D 看板娘插件核心
  - 用途：在网站上显示 Live2D 动态角色
  - 配置：_config.yml 中的 live2d 配置
  - **重要性**：删除后看板娘将消失

### Live2D 模型包（已安装）

#### 当前使用

**live2d-widget-model-unitychan** `^1.0.5` - Unity酱 模型

- 特点：Unity 官方吉祥物，棕色马尾
- 当前状态：✅ 正在使用
- 推荐度：⭐⭐⭐⭐

#### 备选模型

**live2d-widget-model-shizuku** `^1.0.5` - shizuku (雫) 模型- 特点：黑色长发，温柔可爱的女孩

- 当前状态：已安装，未使用
- **live2d-widget-model-hijiki** `^1.0.5` - hijiki (黑) 模型

  - 特点：黑发双马尾，活泼可爱
  - 当前状态：已安装，未使用
- 
- **live2d-widget-model-z16** `^1.0.5` - z16 模型

  - 特点：舰娘风格，金发军装少女
  - 当前状态：已安装，未使用

### 切换模型方法

在 `_config.yml` 中修改：

```yaml
live2d:
  model:
    use: live2d-widget-model-shizuku  # 改成你想要的模型名
```

可用的模型名：

- `live2d-widget-model-shizuku` (当前)
- `live2d-widget-model-hijiki`
- `live2d-widget-model-unitychan`
- `live2d-widget-model-z16`
- `live2d-widget-model-gf`

## ⚠️ 删除建议

### 可以安全删除的依赖

1. **hexo-theme-landscape** - 如果不使用 landscape 主题
2. **未使用的 live2d 模型** - 如果确定不需要某些备选模型

### 必须保留的依赖

- 所有 `hexo-generator-*` - 生成器是必需的
- 所有 `hexo-renderer-*` - 渲染器是必需的
- **hexo**, **hexo-server**, **hexo-deployer-git** - 核心功能

### 谨慎删除的依赖

- **hexo-filter-mathjax** - 如果文章中有数学公式，必须保留
- **hexo-helper-live2d** 及其模型 - 删除后看板娘消失
- **hexo-filter-optimize** - 删除后失去优化功能，但不影响基本使用

## 📝 维护建议

1. **删除前备份**：记录当前的 package.json 内容
2. **逐个测试**：删除后运行 `hexo clean && hexo g` 测试
3. **保留此文档**：记录所有依赖的用途

## 🔄 重新安装

如果误删依赖，使用以下命令重新安装：

```bash
# 重新安装单个包
npm install --save <包名>

# 例如重新安装 shizuku 模型
npm install --save live2d-widget-model-shizuku

# 或者根据 package.json 重新安装所有依赖
npm install
```

---

**最后更新时间**: 2025年10月1日
**维护者**: tkzzzzzz6
