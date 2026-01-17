---
title: 2026-01-16-Neovim插件-CodeStats配置记录
date: 2026-01-16
tags:
  - 工具配置
  - Neovim
  - 插件
  - CodeStats
  - Windows
---

# Neovim 插件配置：Code::Stats 统计

>编写代码和刷算法题按下键盘的时候,一段段字符转化为可视化的 XP 是非常让人有成就感和动力的。**Code::Stats** 是免费的代码统计服务，**codestats.nvim** 则将它接入 Neovim。需要说明的是：官方暂无 Neovim 插件，这个项目由开源大佬维护https://github.com/liljaylj/codestats.nvim?tab=readme-ov-file。

## 1. 前置准备

安装前请确认以下条件：
1. **Neovim** 及其基础环境。
2. **Curl**：用于向服务器发送统计数据。
3. **Code::Stats 账户**：注册后在 Machine Page 获取 **API Key**。  
   [Machine Page](https://codestats.net/my/machines)

## 2. 插件安装与配置

推荐使用 **Lazy.nvim** 管理插件。为保持配置整洁，建议在插件目录下新建 `codestats.lua`：
- macOS/Linux: `~/.config/nvim/lua/plugins/`
- Windows: `C:\Users\<用户名>\.config\nvim\lua\plugins\`

若你已使用 LazyVim，直接放入上述路径即可；否则可先克隆官方仓库：  
[仓库链接](https://github.com/LazyVim/LazyVim)

### 核心配置代码

在 `lua/plugins/` 下创建 `codestats.lua`，填入以下配置（注意必须以 `return` 开头）：

```lua
return {
  'liljaylj/codestats.nvim',
  dependencies = { 'nvim-lua/plenary.nvim' }, -- 必需依赖，提供异步处理能力
  event = { 'TextChanged', 'InsertEnter' },   -- 懒加载：仅在输入文字或进入插入模式时启动
  cmd = { 'CodeStatsXpSend', 'CodeStatsProfileUpdate' }, -- 命令触发加载
  config = function()
    require('codestats').setup {
      username = '<你的用户名>',      -- 用于获取个人资料数据(必须改)
      base_url = 'https://codestats.net', 
      api_key = '<你的 API key>',    -- 你的个人 API 密钥(必须改)
      send_on_exit = true,           -- 退出 nvim 时自动发送 XP
      send_on_timer = true,          -- 开启定时发送功能
      timer_interval = 60000,        -- 建议设置为 60000ms (1分钟)，防止对服务器造成压力
      curl_timeout = 5,              -- 请求超时时间
    }
  end,
}
```

## 3. 进阶：集成到状态栏

如果你想实时看到自己的 XP 或等级，可以将其集成到状态栏中。以常用的 **Lualine** 为例：

```lua
local xp = function()
  -- 获取当前缓冲区对应语言的 XP
  return require('codestats').get_xp(0)
end

require('lualine').setup {
  sections = {
    lualine_x = {
      'filetype',
      { xp, fmt = function(s) return s and (s ~= '0' or nil) and s .. 'xp' end },
    },
  },
}
```

## 4. 常用交互命令

安装完成后，你可以通过以下命令手动管理数据：
*   **`:CodeStatsXpSend`**：立即手动发送当前的 XP 统计。
*   **`:CodeStatsProfileUpdate`**：手动从服务器拉取最新的个人资料数据。

## 5. 常见故障排除

### 1. 报错 `Failed to load ...: return expected`
**原因**：在 `lua/plugins/` 下的文件没有使用 `return { ... }` 结构。
**解决**：确保你的插件配置文件以 `return` 开头，将配置表传递给 Lazy.nvim。

### 2. 插件克隆失败 (`Connection was reset`)
**原因**：通常是网络环境导致无法正常访问 GitHub。  
**解决**：
*   在 Neovim 中输入 **`:Lazy`**，选中插件并按 **`R`** 键重试。
*   检查你的终端是否配置了正确的网络代理。

### 3. `plenary.nvim` 依赖问题
`codestats.nvim` 依赖 `plenary.nvim` 来处理异步任务（如 `plenary.job`）。只要在 `dependencies` 中声明，Lazy.nvim 会自动为你安装，无需手动干预。

---

## 6. 结语

希望对你有帮助,现在就打开你的 Neovim，开始累积你的编程经验值吧！
