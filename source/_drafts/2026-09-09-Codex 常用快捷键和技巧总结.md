---

title: VS Code 常用快捷键与使用技巧速查
date: 2026-07-13
categories:
- 开发工具
tags:
- VS Code
- 快捷键
- Linux
- 开发效率

---

# VS Code 常用快捷键与使用技巧速查

> 适用于 Ubuntu/Linux 下的 VS Code 默认键位。
> `Ctrl+K, Ctrl+S` 表示先按 `Ctrl+K`，松开后再按 `Ctrl+S`。
> 部分快捷键可能与桌面环境、输入法或插件产生冲突。

## 一、核心操作

```bash
Ctrl+Shift+P            # 打开命令面板
F1                      # 打开命令面板

Ctrl+P                  # 快速打开文件
Ctrl+Shift+N            # 打开新的 VS Code 窗口
Ctrl+Shift+W            # 关闭当前 VS Code 窗口

Ctrl+,                  # 打开设置
Ctrl+K, Ctrl+S          # 打开快捷键设置

Ctrl+B                  # 显示或隐藏主侧边栏
Ctrl+J                  # 显示或隐藏底部面板
Ctrl+`                  # 显示或隐藏集成终端

Ctrl+Q                  # 快速打开指定视图(例如资源管理器、搜索、Git、调试、扩展等)
F6                      # 将焦点切换到下一个界面区域
Shift+F6                # 将焦点切换到上一个界面区域
```

命令面板是 VS Code 的核心入口，几乎所有内置功能和插件命令都可以通过 `Ctrl+Shift+P` 搜索执行。键盘快捷键可以通过 `Ctrl+K, Ctrl+S` 查看和修改。

## 二、文件操作

```bash
Ctrl+N                  # 新建文件
Ctrl+O                  # 打开文件
Ctrl+S                  # 保存当前文件
Ctrl+Shift+S            # 文件另存为
Ctrl+K, S               # 保存所有文件

Ctrl+W                  # 关闭当前编辑器
Ctrl+K, W               # 关闭所有编辑器
Ctrl+Shift+T            # 重新打开最近关闭的编辑器

Ctrl+Tab                # 在最近打开的文件之间切换
Ctrl+PageDown           # 切换到右侧编辑器标签
Ctrl+PageUp             # 切换到左侧编辑器标签
```

## 三、代码编辑

```bash
Ctrl+X                  # 剪切选中内容；未选中时剪切当前行
Ctrl+C                  # 复制选中内容；未选中时复制当前行
Ctrl+V                  # 粘贴

Ctrl+Z                  # 撤销
Ctrl+Shift+Z            # 重做

Ctrl+A                  # 全选
Ctrl+Backspace          # 删除光标前的一个单词
Ctrl+Delete             # 删除光标后的一个单词

Ctrl+Shift+K            # 删除当前行
Ctrl+Enter              # 在当前行下方插入新行
Ctrl+Shift+Enter        # 在当前行上方插入新行

Alt+Up                  # 当前行或选中代码向上移动
Alt+Down                # 当前行或选中代码向下移动

Shift+Alt+Up            # 向上复制当前行或选中代码
Shift+Alt+Down          # 向下复制当前行或选中代码

Ctrl+]                  # 增加缩进
Ctrl+[                  # 减少缩进
```

### 快速复制或移动代码

```bash
Alt+Up                  # 将代码向上移动
Alt+Down                # 将代码向下移动

Shift+Alt+Up            # 向上复制一份代码
Shift+Alt+Down          # 向下复制一份代码
```

这组快捷键适合调整语句顺序、复制配置项以及快速生成结构相似的代码。

## 四、代码注释

```bash
Ctrl+/                  # 添加或取消行注释
Shift+Alt+A             # 添加或取消块注释
```

使用示例：

```bash
Ctrl+/                  # 注释当前行
Ctrl+/                  # 再按一次取消注释

选中多行
Ctrl+/                  # 批量添加或取消行注释
```

## 五、格式化与代码修复

```bash
Shift+Alt+F             # 格式化整个文档
Ctrl+K, Ctrl+F          # 格式化选中代码

Ctrl+.                  # 打开快速修复和代码操作
F2                      # 重命名变量、函数、类或其他符号

Ctrl+Space              # 手动触发代码补全
Ctrl+Shift+Space        # 显示函数参数提示
```

推荐优先掌握：

```bash
Ctrl+.                  # 修复错误、导入模块、执行重构
F2                      # 基于代码语义安全重命名
Shift+Alt+F             # 格式化当前文件
Ctrl+Space              # 手动触发补全
```

不要使用普通文本替换批量重命名代码符号：

```bash
Ctrl+H                  # 适合替换普通文本，不适合安全重命名符号
F2                      # 推荐用于重命名变量、函数、类和接口
```

## 六、查找与替换

### 当前文件

```bash
Ctrl+F                  # 在当前文件中查找
Ctrl+H                  # 在当前文件中替换

Enter                   # 跳转到下一个匹配结果
Shift+Enter             # 跳转到上一个匹配结果

F3                      # 查找下一个
Shift+F3                # 查找上一个

Alt+Enter               # 为全部匹配结果创建选择
```

### 整个项目

```bash
Ctrl+Shift+F            # 在整个工作区中搜索
Ctrl+Shift+H            # 在整个工作区中替换
```

VS Code 的当前文件查找默认使用 `Ctrl+F`，工作区搜索则使用 `Ctrl+Shift+F`。

### 常用搜索技巧

```bash
"hello world"           # 搜索完整文本
-.js                    # 仅搜索 JavaScript 文件
-.{js,ts}               # 搜索 JavaScript 和 TypeScript 文件
!node_modules           # 排除 node_modules
src/--                  # 只搜索 src 目录
```

搜索面板中可以组合使用：

```bash
files to include        # 限定需要搜索的文件或目录
files to exclude        # 排除文件或目录
Match Case              # 区分大小写
Match Whole Word        # 匹配完整单词
Use Regular Expression  # 使用正则表达式
```

## 七、多光标与批量编辑

```bash
Ctrl+D                  # 选择下一个相同内容
Ctrl+Shift+L            # 选择所有相同内容
Shift+Alt+I             # 在所有选中行末尾添加光标

Ctrl+U                  # 撤销最后一次光标操作
Esc                     # 退出多光标模式
```

Ubuntu 下还可以使用：

```bash
Ctrl+Alt+Down           # 在下方添加光标
Ctrl+Alt+Up             # 在上方添加光标
```

但这两个快捷键可能与 Linux 桌面环境的工作区切换快捷键冲突。

### 批量修改同名变量

```bash
将光标放到目标文本上
Ctrl+D                  # 逐个选择后续相同文本
Ctrl+D                  # 继续选择
直接输入                # 同时修改所有已选择位置
Esc                     # 退出多光标模式
```

### 修改全部相同文本

```bash
选中目标文本
Ctrl+Shift+L            # 选中当前文件中的所有相同文本
直接输入                # 同时修改
```

需要基于语言语义重命名变量时，仍然优先使用：

```bash
F2                      # 安全重命名代码符号
```

## 八、快速打开与代码导航

```bash
Ctrl+P                  # 按文件名快速打开文件
Ctrl+G                  # 跳转到指定行
Ctrl+Shift+O            # 跳转到当前文件中的符号
Ctrl+T                  # 搜索整个工作区中的符号
```

在 `Ctrl+P` 输入框中还可以使用：

```bash
文件名                  # 搜索并打开文件
:120                    # 跳转到当前文件第 120 行
@                       # 查看当前文件中的符号
@:                      # 按类别查看当前文件中的符号
#                       # 搜索整个工作区中的符号
>                       # 搜索并执行命令
```

推荐操作：

```bash
Ctrl+P
输入部分文件名
Enter                   # 快速打开文件
```

```bash
Ctrl+Shift+O
输入函数名或类名
Enter                   # 跳转到当前文件中的指定符号
```

## 九、定义与引用

```bash
F12                     # 跳转到定义
Alt+F12                 # 内嵌查看定义
Ctrl+F12                # 跳转到实现
Shift+F12               # 查看所有引用

Ctrl+-                  # 返回上一个位置
Ctrl+Shift+-            # 前进到下一个位置
```

VS Code 支持使用 `F12` 跳转到定义，并通过导航历史快捷键在之前访问的位置之间返回和前进。

### 阅读源码的常用工作流

```bash
F12                     # 跳转到函数或类型定义
F12                     # 继续进入下一层定义

Ctrl+-                  # 返回上一层
Ctrl+-                  # 返回最初位置
```

### 不切换文件查看定义

```bash
Alt+F12                 # 在当前文件中内嵌查看定义
Esc                     # 关闭内嵌定义窗口
```

### 修改函数前检查影响范围

```bash
Shift+F12               # 查看函数、变量或类型的所有引用
```

## 十、编辑器窗口管理

```bash
Ctrl+1                  # 聚焦第一个编辑器组
Ctrl+2                  # 聚焦第二个编辑器组
Ctrl+3                  # 聚焦第三个编辑器组

Ctrl+\                  # 拆分当前编辑器
Ctrl+K, Ctrl+Left       # 聚焦左侧编辑器组
Ctrl+K, Ctrl+Right      # 聚焦右侧编辑器组

Ctrl+W                  # 关闭当前编辑器
Ctrl+K, W               # 关闭所有编辑器
Ctrl+K, Z               # 进入或退出禅模式
```

### 左右对照阅读代码

```bash
Ctrl+\                  # 将编辑器拆分为两栏
Ctrl+1                  # 聚焦左侧编辑器
Ctrl+2                  # 聚焦右侧编辑器
```

适合：

```bash
左侧                    # 查看接口、旧代码或调用方
右侧                    # 编写实现或修改新代码
```

## 十一、侧边栏与视图切换

```bash
Ctrl+Shift+E            # 打开资源管理器
Ctrl+Shift+F            # 打开全局搜索
Ctrl+Shift+G            # 打开源代码管理
Ctrl+Shift+D            # 打开运行和调试
Ctrl+Shift+X            # 打开扩展管理

Ctrl+B                  # 显示或隐藏侧边栏
Ctrl+Q                  # 快速打开指定视图
```

### 使用键盘打开插件视图

```bash
Ctrl+Q                  # 打开快速视图选择器
输入插件或视图名称
↑ / ↓                   # 选择目标视图
Enter                   # 打开视图
```

例如：

```bash
Ctrl+Q
Docker
Enter                   # 打开 Docker 视图
```

```bash
Ctrl+Q
GitLens
Enter                   # 打开 GitLens 相关视图
```

### 在界面区域之间移动焦点

```bash
F6                      # 聚焦下一个界面区域
Shift+F6                # 聚焦上一个界面区域
```

聚焦侧边栏后：

```bash
↑ / ↓                   # 切换项目
Enter                   # 打开项目
Tab                     # 进入下一控件
Shift+Tab               # 返回上一控件
```

## 十二、集成终端

```bash
Ctrl+`                  # 显示或隐藏集成终端
Ctrl+Shift+`            # 创建新的集成终端
```

VS Code 官方文档将 `Ctrl+`` 作为 Windows 和 Linux 下打开集成终端的默认快捷键。

### 在编辑器和终端之间切换

```bash
Ctrl+`                  # 聚焦或打开终端
Ctrl+1                  # 返回第一个编辑器组
```

### 清理终端输出

终端聚焦时：

```bash
Ctrl+Shift+P
Terminal: Clear         # 清空当前终端
```

也可以直接执行：

```bash
clear                   # Bash、Zsh 等 Shell 清屏
```

### 从终端打开 VS Code

```bash
code .                  # 在 VS Code 中打开当前目录
code 文件名             # 打开指定文件
code 目录名             # 打开指定目录
code --help             # 查看 code 命令帮助
```

VS Code 官方 CLI 支持使用 `code` 命令打开文件或目录，并可通过 `code --help` 查看完整参数。

## 十三、运行与调试

```bash
F5                      # 启动或继续调试
Ctrl+F5                 # 不调试直接运行
Shift+F5                # 停止调试
Ctrl+Shift+F5           # 重新启动调试

F9                      # 添加或删除断点
F10                     # 单步跳过
F11                     # 单步进入
Shift+F11               # 单步跳出
F6                      # 暂停调试
```

这些是 VS Code 默认调试键位。

### 基础调试流程

```bash
F9                      # 在目标行设置断点
F5                      # 启动调试
F10                     # 执行当前语句，不进入函数
F11                     # 进入当前调用的函数
Shift+F11               # 跳出当前函数
F5                      # 继续运行到下一个断点
Shift+F5                # 停止调试
```

### 条件断点

操作流程：

```bash
在断点位置右键
Edit Breakpoint
Expression              # 输入触发条件
```

示例条件：

```javascript
user.id === 100
```

```javascript
index > 50
```

```javascript
response.status >= 400
```

条件断点适合循环、批量数据和高频调用场景，可以避免程序在无关数据上反复暂停。

### 日志断点

操作流程：

```bash
在代码行左侧右键
Add Logpoint
输入需要输出的内容
```

示例：

```text
当前用户 ID：{user.id}
```

日志断点只输出信息，不会暂停程序，适合临时观察变量值。

## 十四、Git 与源代码管理

```bash
Ctrl+Shift+G            # 打开源代码管理视图
Ctrl+Shift+P            # 打开命令面板并搜索 Git 命令
```

推荐使用命令面板执行：

```bash
Git: Clone              # 克隆仓库
Git: Pull               # 拉取远程更新
Git: Push               # 推送本地提交
Git: Fetch              # 获取远程更新
Git: Checkout to        # 切换分支
Git: Create Branch      # 创建分支
Git: Commit             # 提交更改
Git: View History       # 查看历史记录
```

### 查看当前文件修改

```bash
Ctrl+Shift+G            # 打开源代码管理
Enter                   # 打开选中的修改文件
```

文件打开后可以查看：

```bash
左侧                    # 修改前内容
右侧                    # 修改后内容
```

## 十五、文件资源管理器技巧

```bash
Ctrl+Shift+E            # 聚焦资源管理器
```

资源管理器聚焦后：

```bash
↑ / ↓                   # 上下选择文件或目录
Right                   # 展开目录
Left                    # 折叠目录或返回父级
Enter                   # 打开文件
Space                   # 预览文件

Ctrl+C                  # 复制文件
Ctrl+X                  # 剪切文件
Ctrl+V                  # 粘贴文件
Delete                  # 删除选中项目
F2                      # 重命名文件或目录
```

### 创建文件和目录

由于不同系统和键位配置可能不同，建议通过命令面板执行：

```bash
Ctrl+Shift+P
File: New File          # 创建文件
File: New Folder        # 创建目录
```

也可以为这两个命令单独配置快捷键。

## 十六、折叠代码

```bash
Ctrl+Shift+[            # 折叠当前代码区域
Ctrl+Shift+]            # 展开当前代码区域

Ctrl+K, Ctrl+0          # 折叠所有代码区域
Ctrl+K, Ctrl+J          # 展开所有代码区域
```

适合阅读大型文件：

```bash
Ctrl+K, Ctrl+0          # 先折叠全部代码
Ctrl+Shift+]            # 逐个展开需要查看的区域
```

## 十七、修改快捷键

```bash
Ctrl+K, Ctrl+S          # 打开快捷键设置
```

操作流程：

```bash
Ctrl+K, Ctrl+S
输入命令名称            # 搜索目标命令
Enter                   # 编辑选中的快捷键
按下新快捷键
Enter                   # 保存
```

也可以打开快捷键 JSON：

```bash
Ctrl+Shift+P
Preferences: Open Keyboard Shortcuts (JSON)
```

示例：

```json
[
  {
    "key": "ctrl+alt+d",
    "command": "workbench.view.debug"
  },
  {
    "key": "ctrl+alt+e",
    "command": "workbench.view.explorer"
  }
]
```

VS Code 的快捷键编辑器可以搜索所有内置命令和插件命令，也支持修改、删除或重置键位。

## 十八、推荐设置

打开设置：

```bash
Ctrl+,                  # 打开图形化设置
```

打开 `settings.json`：

```bash
Ctrl+Shift+P
Preferences: Open User Settings (JSON)
```

### 保存时自动格式化

```json
{
  "editor.formatOnSave": true
}
```

### 自动保存

```json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

### 保存时整理导入

不同语言插件提供的具体代码操作可能不同，例如：

```json
{
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  }
}
```

### 显示空白字符

```json
{
  "editor.renderWhitespace": "selection"
}
```

### 显示垂直标尺

```json
{
  "editor.rulers": [80, 120]
}
```

### 调整制表符

```json
{
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "editor.detectIndentation": true
}
```

### 排除大型目录

```json
{
  "files.exclude": {
    "--/.git": true,
    "--/node_modules": true,
    "--/__pycache__": true
  },
  "search.exclude": {
    "--/node_modules": true,
    "--/dist": true,
    "--/build": true
  }
}
```

## 十九、工作区设置

VS Code 配置通常分为：

```bash
用户设置                # 对所有项目生效
工作区设置              # 只对当前项目生效
```

项目专属设置可以放在：

```bash
.vscode/settings.json   # 当前项目的编辑器设置
.vscode/launch.json     # 调试配置
.vscode/tasks.json      # 构建或运行任务
.vscode/extensions.json # 项目推荐插件
```

建议将项目通用配置提交到 Git：

```bash
.vscode/settings.json
.vscode/launch.json
.vscode/tasks.json
.vscode/extensions.json
```

包含个人路径、密码、Token 或机器专属参数的配置不要提交。

## 二十、任务系统

通过命令面板运行任务：

```bash
Ctrl+Shift+P
Tasks: Run Task         # 选择并运行任务
Tasks: Run Build Task   # 运行默认构建任务
Tasks: Configure Task   # 配置任务
```

默认构建快捷键：

```bash
Ctrl+Shift+B            # 运行默认构建任务
```

示例 `.vscode/tasks.json`：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "启动开发服务器",
      "type": "shell",
      "command": "npm run dev",
      "group": "build",
      "problemMatcher": []
    }
  ]
}
```

## 二十一、常用命令面板命令

```bash
Ctrl+Shift+P            # 打开命令面板
```

推荐搜索：

```bash
Developer: Reload Window            # 重新加载 VS Code 窗口
Developer: Toggle Developer Tools   # 打开开发者工具

Format Document                     # 格式化当前文档
Change Language Mode                # 修改当前文件语言模式
Change File Encoding                # 修改文件编码
Change End of Line Sequence         # 切换 LF 或 CRLF

Preferences: Open User Settings     # 打开用户设置
Preferences: Open Keyboard Shortcuts # 打开快捷键设置

View: Open View                     # 打开指定内置或插件视图
View: Toggle Primary Side Bar       # 显示或隐藏主侧边栏
View: Toggle Panel                  # 显示或隐藏底部面板

Terminal: Create New Terminal       # 创建终端
Terminal: Kill the Active Terminal  # 关闭当前终端
Terminal: Clear                     # 清空终端

Git: Clone                          # 克隆 Git 仓库
Git: Pull                           # 拉取更新
Git: Push                           # 推送提交
```

## 二十二、插件管理

```bash
Ctrl+Shift+X            # 打开扩展管理
```

扩展视图聚焦后：

```bash
输入插件名称            # 搜索插件
Enter                   # 查看插件详情
```

通过命令面板管理插件：

```bash
Extensions: Install Extensions       # 安装插件
Extensions: Show Installed Extensions # 查看已安装插件
Extensions: Show Enabled Extensions   # 查看已启用插件
Extensions: Show Disabled Extensions  # 查看已禁用插件
```

插件出现异常时可以尝试：

```bash
Ctrl+Shift+P
Developer: Reload Window             # 重新加载窗口
```

仍然异常时：

```bash
禁用插件
重新加载窗口
重新启用插件
```

## 二十三、推荐使用技巧

### 使用命令面板，不死记低频快捷键

```bash
Ctrl+Shift+P            # 打开命令面板
输入功能关键词
Enter                   # 执行命令
```

高频功能记快捷键，低频功能通过命令面板搜索，效率通常更高。

### 使用快速打开代替目录查找

```bash
Ctrl+P                  # 搜索文件名
输入部分文件名
Enter                   # 打开文件
```

项目较大时，通常比在资源管理器中逐层展开目录更快。

### 使用符号搜索定位代码

```bash
Ctrl+Shift+O            # 搜索当前文件中的函数和类
Ctrl+T                  # 搜索整个项目中的符号
```

### 使用导航历史阅读源码

```bash
F12                     # 进入定义
Ctrl+-                  # 返回调用位置
Ctrl+Shift+-            # 再次前进
```

### 使用拆分编辑器对照代码

```bash
Ctrl+\                  # 拆分编辑器
Ctrl+1                  # 左侧编辑器
Ctrl+2                  # 右侧编辑器
```

### 使用快速修复处理常见问题

```bash
Ctrl+.                  # 导入模块、修复错误、执行重构
```

### 使用语义重命名

```bash
F2                      # 重命名变量、函数或类型
```

不要用全局文本替换代替语义重命名。

### 使用多光标处理重复文本

```bash
Ctrl+D                  # 逐个选择相同文本
Ctrl+Shift+L            # 一次选中全部相同文本
```

### 使用终端完成项目操作

```bash
Ctrl+`                  # 打开终端

npm run dev             # 启动前端项目
npm test                # 运行测试
git status              # 查看 Git 状态
python main.py          # 运行 Python 程序
```

### 使用工作区配置保存项目环境

```bash
.vscode/settings.json   # 项目编辑器设置
.vscode/launch.json     # 项目调试设置
.vscode/tasks.json      # 项目任务设置
```

## 二十四、快捷键冲突排查

打开快捷键设置：

```bash
Ctrl+K, Ctrl+S
```

搜索冲突命令：

```bash
输入快捷键              # 查看该快捷键绑定了哪些命令
```

也可以执行：

```bash
Ctrl+Shift+P
Developer: Toggle Keyboard Shortcuts Troubleshooting
```

然后按下出现问题的快捷键，在输出信息中查看 VS Code 实际识别并执行了什么命令。

Linux 下常见冲突来源：

```bash
桌面环境快捷键          # GNOME、KDE 等全局快捷键
输入法快捷键            # Fcitx5、IBus 等输入法
终端 Shell 快捷键       # Bash、Zsh、Tmux 等
插件快捷键              # Vim、Emacs、GitLens 等插件
系统窗口管理快捷键      # 工作区、窗口和布局操作
```

## 二十五、高频快捷键

```bash
Ctrl+Shift+P            # 打开命令面板
Ctrl+P                  # 快速打开文件
Ctrl+Shift+O            # 搜索当前文件中的符号
Ctrl+T                  # 搜索整个项目中的符号

Ctrl+Shift+E            # 打开资源管理器
Ctrl+Shift+F            # 打开全局搜索
Ctrl+Shift+G            # 打开源代码管理
Ctrl+Shift+D            # 打开运行和调试
Ctrl+Shift+X            # 打开扩展管理

Ctrl+B                  # 显示或隐藏侧边栏
Ctrl+`                  # 显示或隐藏终端
Ctrl+Q                  # 快速打开视图
Ctrl+1                  # 返回第一个编辑器组

Ctrl+/                  # 添加或取消行注释
Shift+Alt+F             # 格式化文档
Ctrl+.                  # 快速修复
F2                      # 重命名符号

Alt+Up                  # 向上移动代码
Alt+Down                # 向下移动代码
Shift+Alt+Down          # 向下复制代码

Ctrl+D                  # 选择下一个相同文本
Ctrl+Shift+L            # 选择所有相同文本

F12                     # 跳转到定义
Alt+F12                 # 内嵌查看定义
Shift+F12               # 查看所有引用
Ctrl+-                  # 返回上一个位置

F5                      # 启动或继续调试
F9                      # 添加或删除断点
F10                     # 单步跳过
F11                     # 单步进入

Ctrl+K, Ctrl+S          # 打开快捷键设置
Ctrl+,                  # 打开设置
```

## 二十六、推荐优先形成肌肉记忆

```bash
Ctrl+Shift+P            # 所有命令的统一入口
Ctrl+P                  # 快速打开文件
Ctrl+Shift+O            # 当前文件符号搜索
Ctrl+T                  # 全局符号搜索

Ctrl+.                  # 快速修复和重构
F2                      # 安全重命名
Shift+Alt+F             # 格式化文档

F12                     # 跳转到定义
Ctrl+-                  # 返回跳转前的位置
Shift+F12               # 查看引用

Ctrl+D                  # 批量选择相同文本
Alt+Up / Alt+Down       # 快速移动代码
Shift+Alt+Down          # 快速复制代码

Ctrl+`                  # 打开终端
Ctrl+Shift+G            # 打开 Git 面板
Ctrl+K, Ctrl+S          # 查看或修改快捷键
```

## 备注

```bash
1. 本文默认使用 Ubuntu/Linux 下的 VS Code 默认快捷键。

2. 快捷键可能受到以下内容影响：
   Linux 桌面环境
   输入法
   VS Code 插件
   自定义快捷键
   Vim 或 Emacs 键位插件

3. 快捷键无效时：
   Ctrl+K, Ctrl+S
   搜索命令或快捷键
   检查是否存在冲突

4. 插件视图切换：
   Ctrl+Q
   输入视图名称
   Enter

5. 返回代码编辑区：
   Ctrl+1

6. 查看完整默认快捷键：
   Ctrl+Shift+P
   Preferences: Open Default Keyboard Shortcuts (JSON)
```
