<#
.SYNOPSIS
    只读审计 Windows 的 User / Machine PATH，找出问题条目。不做任何修改。
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File Audit-Path.ps1
#>
[CmdletBinding()]
param(
    # 超过这个长度的条目单独列出来（长路径通常是 shim 没做好）
    [int]$LongThreshold = 45
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8

function Get-Raw {
    param([ValidateSet('User','Machine')][string]$Target)
    [Environment]::GetEnvironmentVariable('Path', $Target)
}

function Get-Entries {
    param([ValidateSet('User','Machine')][string]$Target)
    @((Get-Raw $Target) -split ';' | Where-Object { $_ })
}

# 归一化后的比较键：小写、去引号、反斜杠合并、去掉尾部反斜杠
function Get-Key {
    param([string]$Entry)
    $e = ($Entry.Trim().Trim('"')) -replace '\\+', '\'
    if ($e -notmatch '^[A-Za-z]:\\$') { $e = $e.TrimEnd('\') }
    $e.ToLowerInvariant()
}

# 指向某个用户私有目录（系统级 PATH 里不该有这些）
function Test-UserScoped {
    param([string]$Entry)
    $Entry -match '^[A-Za-z]:\\Users\\[^\\]+\\' -and $Entry -notmatch '^[A-Za-z]:\\Users\\Public\\'
}

$userEntries    = Get-Entries 'User'
$machineEntries = Get-Entries 'Machine'
$reclaimable    = 0

foreach ($pair in @(
    @{ Name = 'User';    Entries = $userEntries },
    @{ Name = 'Machine'; Entries = $machineEntries }
)) {
    $entries = $pair.Entries
    $raw     = Get-Raw $pair.Name

    Write-Host ''
    Write-Host "==================== $($pair.Name) ====================" -ForegroundColor Cyan
    Write-Host ("字符数: {0}    条目数: {1}" -f $raw.Length, $entries.Count)

    # --- 1. 失效目录 ---
    $dead = @($entries | Where-Object { -not (Test-Path -LiteralPath $_) })
    if ($dead) {
        Write-Host ''
        Write-Host '[失效] 目录不存在:' -ForegroundColor Red
        $dead | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }

    # --- 2. 重复条目 ---
    $dupes = @($entries | Group-Object { Get-Key $_ } | Where-Object { $_.Count -gt 1 })
    if ($dupes) {
        Write-Host ''
        Write-Host '[重复] 同一目录出现多次:' -ForegroundColor Yellow
        $dupes | ForEach-Object {
            Write-Host ("  - {0}  x{1}" -f $_.Group[0], $_.Count) -ForegroundColor Yellow
        }
    }

    # --- 3. 格式问题 ---
    $malformed = @($entries | Where-Object {
        $_ -ne $_.Trim() -or $_ -match '\\\\' -or $_ -match '^\s*"|"\s*$'
    })
    if ($malformed) {
        Write-Host ''
        Write-Host '[格式] 含多余空格 / 引号 / 连续反斜杠:' -ForegroundColor Yellow
        $malformed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }

    # --- 4. 超长条目 ---
    $long = @($entries | Where-Object { $_.Length -gt $LongThreshold } | Sort-Object Length -Descending)
    if ($long) {
        Write-Host ''
        Write-Host "[超长] 超过 $LongThreshold 字符（建议改用 shim）:" -ForegroundColor DarkYellow
        $long | ForEach-Object {
            Write-Host ("  - {0,3}  {1}" -f $_.Length, $_) -ForegroundColor DarkYellow
        }
    }
}

# --- 5. Machine PATH 中的用户私有目录（真正的污染）---
Write-Host ''
Write-Host '==================== 交叉检查 ====================' -ForegroundColor Cyan

$leaked = @($machineEntries | Where-Object { Test-UserScoped $_ })
if ($leaked) {
    $reclaimable = (($leaked -join ';').Length)
    Write-Host ("[污染] Machine PATH 中有 {0} 条用户私有目录（只有 {1} 字符可回收）:" -f $leaked.Count, $reclaimable) -ForegroundColor Red
    Write-Host '       这些路径对其它用户/SYSTEM 无意义，应只留在 User PATH' -ForegroundColor Red
    $leaked | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host '[OK] Machine PATH 中没有用户私有目录' -ForegroundColor Green
}

# --- 6. User / Machine 重叠统计（仅供参考，多数情况下是正常的）---
$userKeys = @{}
($userEntries | ForEach-Object { Get-Key $_ }) | ForEach-Object { $userKeys[$_] = $true }
$overlap = @($machineEntries | Where-Object { $userKeys.ContainsKey((Get-Key $_)) })
Write-Host ''
Write-Host ("[参考] Machine 与 User 有 {0} 条重叠" -f $overlap.Count) -ForegroundColor DarkGray
Write-Host '       其中 C:\Program Files\... / D:\... 这类系统级路径同时出现在两边是正常的，不要删' -ForegroundColor DarkGray

# --- 7. 汇总 ---
$userLen    = (Get-Raw 'User').Length
$machineLen = (Get-Raw 'Machine').Length
$total      = $userLen + $machineLen

Write-Host ''
Write-Host '==================== 汇总 ====================' -ForegroundColor Cyan
Write-Host ("User    : {0} 字符 / {1} 条" -f $userLen, $userEntries.Count)
Write-Host ("Machine : {0} 字符 / {1} 条" -f $machineLen, $machineEntries.Count)
Write-Host ("合计    : {0} 字符" -f $total)
Write-Host ("清掉用户私有目录后约 {0} 字符（可省 {1}）" -f ($total - $reclaimable), $reclaimable)
if ($total -gt 2048) {
    Write-Host '! 超过 2048，部分安装器/子进程会截断环境变量' -ForegroundColor Yellow
}
