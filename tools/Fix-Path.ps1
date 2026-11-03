<#
.SYNOPSIS
    清理 Windows PATH，写入前备份到注册表同键 Path.bak.<时间戳>。
.PARAMETER Scope
    User / Machine / Both。Machine 需管理员权限。
.PARAMETER RemoveDead
    删除不存在的目录。
.PARAMETER RemoveLonger
    删除超过 LongThreshold 字符的条目。
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File Fix-Path.ps1 -Scope Both -WhatIf
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [ValidateSet('User', 'Machine', 'Both')][string]$Scope = 'User',
    [switch]$RemoveDead,
    [int]$LongThreshold = 60,
    [switch]$RemoveLonger
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8

function Get-RegPath {
    param([ValidateSet('User','Machine')][string]$Target)
    if ($Target -eq 'User') { 'HKCU:\Environment' }
    else { 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment' }
}

function Normalize {
    param([string[]]$Entries)
    $seen   = @{}
    $result = New-Object System.Collections.Generic.List[string]
    foreach ($raw in $Entries) {
        $e = ($raw.Trim().Trim('"')) -replace '\\+', '\'
        if ($e -notmatch '^[A-Za-z]:\\$') { $e = $e.TrimEnd('\') }
        if (-not $e) { continue }
        $key = $e.ToLowerInvariant()
        if ($seen.ContainsKey($key)) { continue }
        $seen[$key] = $true
        $result.Add($e)
    }
    , $result.ToArray()
}

function Test-UserScoped {
    param([string]$Entry)
    $Entry -match '^[A-Za-z]:\\Users\\[^\\]+\\' -and $Entry -notmatch '^[A-Za-z]:\\Users\\Public\\'
}

function Backup-Path {
    param([ValidateSet('User','Machine')][string]$Target)
    $old  = (Get-ItemProperty -Path (Get-RegPath $Target) -Name Path -ErrorAction SilentlyContinue).Path
    $name = "Path.bak.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Set-ItemProperty -Path (Get-RegPath $Target) -Name $name -Value $old
    Write-Host "[备份] $Target -> $name" -ForegroundColor Cyan
}

# 通知已运行的 GUI 程序环境已变更
function Publish-EnvChange {
    if (-not ('Win32.NativeMethods' -as [type])) {
        Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition @'
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam,
    string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
'@
    }
    $r = [UIntPtr]::Zero
    [void][Win32.NativeMethods]::SendMessageTimeout(
        [IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, 'Environment', 0x2, 5000, [ref]$r)
}

function Repair {
    param([ValidateSet('User','Machine')][string]$Target, [string[]]$Entries)

    $before = @($Entries)
    $after  = @(Normalize $Entries)

    # 只移除用户私有目录，系统级重复项保留
    if ($Target -eq 'Machine') {
        $after = @($after | Where-Object { -not (Test-UserScoped $_) })
    }
    if ($RemoveDead) {
        $after = @($after | Where-Object { Test-Path -LiteralPath $_ })
    }
    if ($RemoveLonger) {
        $after = @($after | Where-Object { $_.Length -le $LongThreshold })
    }

    $oldStr = $before -join ';'
    $newStr = $after  -join ';'

    Write-Host ''
    Write-Host "===== $Target =====" -ForegroundColor Cyan
    Write-Host ("字符 {0} -> {1} ({2})" -f $oldStr.Length, $newStr.Length, ($oldStr.Length - $newStr.Length))
    Write-Host ("条目 {0} -> {1}" -f $before.Count, $after.Count)

    $removed = @(Compare-Object -ReferenceObject $before -DifferenceObject $after |
                 Where-Object { $_.SideIndicator -eq '<=' })
    if ($removed) {
        Write-Host '变更条目:' -ForegroundColor Yellow
        $removed | ForEach-Object { Write-Host "  - $($_.InputObject)" -ForegroundColor Yellow }
    }

    if ($oldStr -eq $newStr) {
        Write-Host '[无变化]' -ForegroundColor DarkGray
        return
    }
    if (-not $PSCmdlet.ShouldProcess("$Target PATH", '写入清理结果')) { return }

    Backup-Path $Target
    [Environment]::SetEnvironmentVariable('Path', $newStr, $Target)
    Write-Host "[已写入 $Target]" -ForegroundColor Green
}

if ($Scope -in 'Both', 'Machine') {
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
               ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        throw '修改 Machine PATH 需要管理员权限，请以管理员身份运行。'
    }
    Repair -Target Machine -Entries @(
        ([Environment]::GetEnvironmentVariable('Path','Machine')) -split ';' | Where-Object { $_ })
}

if ($Scope -in 'Both', 'User') {
    Repair -Target User -Entries @(
        ([Environment]::GetEnvironmentVariable('Path','User')) -split ';' | Where-Object { $_ })
}

Publish-EnvChange
Write-Host ''
Write-Host '[完成] 请重开所有终端。' -ForegroundColor Cyan
