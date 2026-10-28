<#
.SYNOPSIS
    只读审计 Windows 的 User / Machine PATH。不做任何修改。
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File Audit-Path.ps1
#>
[CmdletBinding()]
param([int]$LongThreshold = 45)

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

# 归一化比较键：小写、去引号、反斜杠合并、去尾部反斜杠
function Get-Key {
    param([string]$Entry)
    $e = ($Entry.Trim().Trim('"')) -replace '\\+', '\'
    if ($e -notmatch '^[A-Za-z]:\\$') { $e = $e.TrimEnd('\') }
    $e.ToLowerInvariant()
}

# 用户私有目录（Public 除外）
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
    Write-Host "===== $($pair.Name) =====" -ForegroundColor Cyan
    Write-Host ("字符 {0} / 条目 {1}" -f $raw.Length, $entries.Count)

    $dead = @($entries | Where-Object { -not (Test-Path -LiteralPath $_) })
    if ($dead) {
        Write-Host '[失效]' -ForegroundColor Red
        $dead | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }

    $dupes = @($entries | Group-Object { Get-Key $_ } | Where-Object { $_.Count -gt 1 })
    if ($dupes) {
        Write-Host '[重复]' -ForegroundColor Yellow
        $dupes | ForEach-Object {
            Write-Host ("  - {0}  x{1}" -f $_.Group[0], $_.Count) -ForegroundColor Yellow
        }
    }

    $malformed = @($entries | Where-Object {
        $_ -ne $_.Trim() -or $_ -match '\\\\' -or $_ -match '^\s*"|"\s*$'
    })
    if ($malformed) {
        Write-Host '[格式]' -ForegroundColor Yellow
        $malformed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }

    $long = @($entries | Where-Object { $_.Length -gt $LongThreshold } |
              Sort-Object Length -Descending)
    if ($long) {
        Write-Host "[超长 > $LongThreshold]" -ForegroundColor DarkYellow
        $long | ForEach-Object {
            Write-Host ("  - {0,3}  {1}" -f $_.Length, $_) -ForegroundColor DarkYellow
        }
    }
}

Write-Host ''
Write-Host '===== 交叉检查 =====' -ForegroundColor Cyan
$leaked = @($machineEntries | Where-Object { Test-UserScoped $_ })
if ($leaked) {
    $reclaimable = (($leaked -join ';').Length)
    Write-Host ("[污染] Machine 含 {0} 条用户私有目录，可回收 {1} 字符" -f $leaked.Count, $reclaimable) -ForegroundColor Red
    $leaked | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host '[OK] Machine 中无用户私有目录' -ForegroundColor Green
}

$userKeys = @{}
($userEntries | ForEach-Object { Get-Key $_ }) | ForEach-Object { $userKeys[$_] = $true }
$overlap  = @($machineEntries | Where-Object { $userKeys.ContainsKey((Get-Key $_)) })
Write-Host ("[参考] Machine 与 User 重叠 {0} 条，其中系统级路径属正常，勿删" -f $overlap.Count) -ForegroundColor DarkGray

$total = (Get-Raw 'User').Length + (Get-Raw 'Machine').Length
Write-Host ''
Write-Host ("合计 {0} 字符，清理后约 {1}" -f $total, ($total - $reclaimable)) -ForegroundColor Cyan
