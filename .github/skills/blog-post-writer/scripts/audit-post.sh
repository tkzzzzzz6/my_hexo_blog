#!/usr/bin/env bash
#
# audit-post.sh —— 只读检查 Hexo 文章的 frontmatter 与排版问题。
#
# 只打印报告，绝不修改任何文件。修复动作由 skill 在用户确认后执行。
#
# 用法：
#   scripts/audit-post.sh <文章.md> [更多文章.md ...]    # 也接受文件名或标题片段
#   scripts/audit-post.sh --all                          # source/_posts 下全部文章
#   scripts/audit-post.sh --drafts                       # source/_drafts 下全部草稿
#   scripts/audit-post.sh -v --all                       # 同时列出没有问题的文件
#   scripts/audit-post.sh --help
#
# 退出码：0 = 未发现错误（可能有 ⚠ 建议）；1 = 发现错误或用法错误。
#
# 为什么需要它：Hexo 对 frontmatter 错误完全静默。键名拼错、用 TAB 缩进导致
# YAML 解析失败、漏写 categories，构建日志里都和正常文章一模一样。

set -uo pipefail

# ---------------------------------------------------------------- 路径与颜色

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$HERE/../../../.." && pwd)
POSTS_DIR="$REPO_ROOT/source/_posts"
DRAFTS_DIR="$REPO_ROOT/source/_drafts"

if [ -t 1 ]; then
  C_ERR=$'\033[31m'; C_WARN=$'\033[33m'; C_OK=$'\033[32m'; C_DIM=$'\033[2m'; C_RST=$'\033[0m'
else
  C_ERR=""; C_WARN=""; C_OK=""; C_DIM=""; C_RST=""
fi

# 正文要点泄漏进标签的典型特征：全角冒号 / Markdown 标记 / 复杂度 / 纯数字 / 破损值
NOISE_RE='：|\*\*|O\(|^--$|^[0-9]+$'

# ---------------------------------------------------------------- 全局计数

FILES=0
FILES_BAD=0
ERRORS=0
WARNINGS=0
VERBOSE=0

# 每个文件重置
P_ACC=""
S_ACC=""

add_p() { P_ACC="${P_ACC}$1"$'\n'; }
add_s() { S_ACC="${S_ACC}$1"$'\n'; }

usage() {
  cat <<'EOF'
用法：
  audit-post.sh <文章.md> [更多文章.md ...]
  audit-post.sh --all        检查 source/_posts 下全部文章
  audit-post.sh --drafts     检查 source/_drafts 下全部草稿
  audit-post.sh -v --all     同时列出没有问题的文件
EOF
}

# ---------------------------------------------------------------- 工具函数

# 把用户给的东西解析成真实文件路径
resolve() {
  local p="$1"
  if [ -f "$p" ]; then
    printf '%s/%s\n' "$(cd "$(dirname "$p")" && pwd)" "$(basename "$p")"
    return
  fi
  if [ -f "$POSTS_DIR/$p" ]; then printf '%s\n' "$POSTS_DIR/$p"; return; fi
  if [ -f "$DRAFTS_DIR/$p" ]; then printf '%s\n' "$DRAFTS_DIR/$p"; return; fi
  printf '%s\n' "$p"
}

# 取出 frontmatter 主体（首个 --- 与第二个 --- 之间的内容）
fm_body() {
  awk 'NR == 1 && $0 != "---" { exit }
       NR > 1 && $0 == "---" { exit }
       NR > 1 { print }' "$1"
}

# 取出某个块的原始行（只在 frontmatter 范围内，不会扫到正文）
extract_block() {
  awk -v key="$2" '
    fm >= 2 { exit }
    $0 == "---" { fm++; next }
    fm == 1 && index($0, key ":") == 1 {
      rest = substr($0, length(key) + 2)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", rest)
      if (rest != "") print rest
      f = 1; next
    }
    fm == 1 && f && /^[A-Za-z_]+:/ { exit }
    fm == 1 && f { print }
  ' "$1"
}

# 把块内容洗成一行一个值
clean_list() {
  sed -E 's/^[[:space:]]*-[[:space:]]*//; s/^[[:space:]]+//; s/[[:space:]]+$//' | grep -v '^$' || true
}

# ---------------------------------------------------------------- 单文件审计

audit_file() {
  local raw="$1"
  local src
  src=$(resolve "$raw")
  local rel="${src#"$REPO_ROOT"/}"

  P_ACC=""
  S_ACC=""
  FILES=$((FILES + 1))

  if [ ! -f "$src" ]; then
    printf '%s✗ 文件不存在：%s%s\n' "$C_ERR" "$raw" "$C_RST"
    ERRORS=$((ERRORS + 1))
    FILES_BAD=$((FILES_BAD + 1))
    return
  fi

  local is_draft=0
  case "$src" in "$DRAFTS_DIR"/*) is_draft=1 ;; esac

  # 规范化副本：去掉 BOM 与行尾 CR，后续所有检查都基于它。
  # 站内有近百篇文章是 CRLF 换行；不归一化就会把每一篇都误判成「frontmatter 缺失」。
  # tr/awk 只删行尾 CR 不删换行符，所以行号与原文件完全一致。
  local f
  f=$(mktemp "${TMPDIR:-/tmp}/audit-post.XXXXXX")
  awk 'NR == 1 { sub(/^\357\273\277/, "") } { sub(/\r$/, ""); print }' "$src" > "$f"

  # ---- 0. 换行风格（只提示，不影响其余检查）
  local crlf
  crlf=$(awk '/\r$/{c++} END{print c+0}' "$src")
  if [ "$crlf" -gt 0 ]; then
    add_s "${crlf} 行使用 CRLF 换行（站内以 LF 为主，建议统一）"
  fi

  # ---- 1. frontmatter 存在性与闭合
  local first_line fm_count
  first_line=$(head -n 1 "$f")
  fm_count=$(grep -c '^---$' "$f" 2>/dev/null)
  fm_count=${fm_count:-0}

  local has_fm=1
  if [ "$first_line" != "---" ] || [ "$fm_count" -lt 2 ]; then
    add_p "frontmatter 缺失或未闭合（首行须为 ---，且 --- 至少出现两次，当前 ${fm_count} 次）"
    has_fm=0
  fi

  # ---- 2. TAB 缩进（YAML 禁止，会导致整段 frontmatter 解析失败）
  if [ "$has_fm" -eq 1 ]; then
    if fm_body "$f" | grep -q $'^\t'; then
      add_p "frontmatter 使用了 TAB 缩进 —— YAML 禁止，整段 frontmatter 会解析失败（改为 2 个空格）"
    fi
  fi

  local fm=""
  [ "$has_fm" -eq 1 ] && fm=$(fm_body "$f")

  # ---- 3. 键名拼写
  local typos
  typos=$(printf '%s\n' "$fm" | grep -E '^(catagories|categoreis|categoy|catagory|tages|titel|deta):' || true)
  if [ -n "$typos" ]; then
    local line
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      add_p "键名拼写错误：${line}（Hexo 会静默忽略该键）"
    done <<< "$typos"
  fi

  # ---- 4. 必需键
  if [ "$has_fm" -eq 1 ]; then
    local k
    for k in title date tags; do
      if ! printf '%s\n' "$fm" | grep -qE "^$k:"; then
        add_p "缺少必需键：${k}"
      fi
    done
    if ! printf '%s\n' "$fm" | grep -qE '^categories:'; then
      add_p "缺少必需键：categories（会归入 _config.yml 的 default_category）"
    fi
  fi

  # ---- 5. date 格式
  local dateline=""
  dateline=$(printf '%s\n' "$fm" | grep -m1 -E '^date:' || true)
  if [ -n "$dateline" ]; then
    if ! printf '%s\n' "$dateline" |
      grep -qE '^date:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}([ T][0-9]{2}:[0-9]{2}(:[0-9]{2})?)?[[:space:]]*$'; then
      add_p "date 格式异常：${dateline}（推荐 YYYY-MM-DD）"
    fi
  fi

  # ---- 6. 文件名与 date 一致性
  local base fexdate fdate
  base=$(basename "$src" .md)
  if [[ "$base" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})-(.+)$ ]]; then
    fexdate=${BASH_REMATCH[1]}
    fdate=$(printf '%s\n' "$dateline" | sed -nE 's/^date:[[:space:]]*([0-9]{4}-[0-9]{2}-[0-9]{2}).*/\1/p')
    if [ -n "$fdate" ] && [ "$fdate" != "$fexdate" ]; then
      add_p "文件名日期（${fexdate}）与 frontmatter date（${fdate}）不一致"
    fi
  elif [ "$is_draft" -eq 0 ]; then
    add_s "文件名缺少 YYYY-MM-DD- 前缀（站内命名约定）"
  fi

  # ---- 7. 列表缩进一致性（站内统一 2 个空格）
  if [ "$has_fm" -eq 1 ]; then
    local badind indn
    badind=$(fm_body "$f" | grep -nE '^[[:space:]]+-' | grep -vE '^[0-9]+:  -' || true)
    if [ -n "$badind" ]; then
      indn=$(printf '%s\n' "$badind" | wc -l | tr -d ' ')
      add_s "${indn} 处列表缩进不是 2 个空格（站内统一用 2 空格）"
    fi
  fi

  # ---- 8. 标签：噪声 + 重复
  local tags
  tags=$(extract_block "$f" tags | clean_list)
  if [ -n "$tags" ]; then
    local noise
    noise=$(printf '%s\n' "$tags" | grep -E "$NOISE_RE" || true)
    if [ -n "$noise" ]; then
      local line
      while IFS= read -r line; do
        [ -z "$line" ] && continue
        add_s "标签疑似正文泄漏：「${line}」"
      done <<< "$noise"
    fi

    local dups
    dups=$(printf '%s\n' "$tags" | sort | uniq -d)
    if [ -n "$dups" ]; then
      local d
      while IFS= read -r d; do
        [ -z "$d" ] && continue
        add_p "标签重复：「${d}」"
      done <<< "$dups"
    fi
  fi

  # ---- 9. 图片图床
  local badimg
  badimg=$(grep -nE '!\[[^]]*\]\(https?://' "$f" |
    grep -v 'tk-pichost-1325224430\.cos\.ap-chengdu\.myqcloud\.com' || true)
  if [ -n "$badimg" ]; then
    local n
    n=$(printf '%s\n' "$badimg" | wc -l | tr -d ' ')
    add_s "${n} 处图片未使用站内 COS 域名"
  fi

  # ---- 10. 代码块语言 / 标题层级
  local scan
  scan=$(awk -v hasfm="$has_fm" '
    BEGIN { fm = (hasfm ? 0 : 2); infence = 0; prev = 0 }

    fm < 2 { if ($0 == "---") fm++; next }

    /^[[:space:]]*```/ {
      if (!infence) {
        rest = $0
        sub(/^[[:space:]]*```/, "", rest)
        gsub(/[[:space:]]/, "", rest)
        if (rest == "") print "CODE_NOLANG " NR
        infence = 1
      } else {
        infence = 0
      }
      next
    }

    infence { next }

    /^#+[[:space:]]/ {
      n = 0
      while (substr($0, n + 1, 1) == "#") n++
      if (n > 4) print "H_DEEP " NR " " n
      if (prev > 0 && n > prev + 1 && prev < 4) print "H_JUMP " NR " H" prev "->H" n
      prev = n
    }
  ' "$f")

  if [ -n "$scan" ]; then
    while IFS=' ' read -r kind line extra; do
      [ -z "$kind" ] && continue
      case "$kind" in
        CODE_NOLANG) add_p "第 ${line} 行代码块未标注语言" ;;
        H_DEEP) add_s "第 ${line} 行标题层级过深（H${extra}），站内不深于 H4" ;;
        H_JUMP) add_s "第 ${line} 行标题层级跳跃（${extra}）" ;;
      esac
    done <<< "$scan"
  fi

  # ---- 输出
  local pcount scount
  pcount=$(printf '%s' "$P_ACC" | grep -c . || true)
  scount=$(printf '%s' "$S_ACC" | grep -c . || true)
  pcount=${pcount:-0}
  scount=${scount:-0}

  if [ "$pcount" -eq 0 ] && [ "$scount" -eq 0 ]; then
    [ "$VERBOSE" -eq 1 ] && printf '%s✓ %s%s\n' "$C_OK" "$rel" "$C_RST"
    rm -f "$f"
    return
  fi

  FILES_BAD=$((FILES_BAD + 1))
  printf '\n%s%s%s\n' "$C_DIM" "$rel" "$C_RST"

  local l
  while IFS= read -r l; do
    [ -z "$l" ] && continue
    printf '  %s✗%s %s\n' "$C_ERR" "$C_RST" "$l"
    ERRORS=$((ERRORS + 1))
  done <<< "$P_ACC"

  while IFS= read -r l; do
    [ -z "$l" ] && continue
    printf '  %s⚠%s %s\n' "$C_WARN" "$C_RST" "$l"
    WARNINGS=$((WARNINGS + 1))
  done <<< "$S_ACC"

  rm -f "$f"
}

# ---------------------------------------------------------------- 入口

if [ $# -eq 0 ]; then
  usage >&2
  exit 1
fi

TARGETS=""
case "$1" in
  --help|-h)
    usage
    exit 0
    ;;
esac

while [ $# -gt 0 ]; do
  case "$1" in
    -v|--verbose)
      VERBOSE=1
      shift
      ;;
    --all)
      shopt -s nullglob
      for p in "$POSTS_DIR"/*.md; do TARGETS="${TARGETS}${p}"$'\n'; done
      shift
      ;;
    --drafts)
      shopt -s nullglob
      for p in "$DRAFTS_DIR"/*.md; do TARGETS="${TARGETS}${p}"$'\n'; done
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    -*)
      printf '未知参数：%s\n' "$1" >&2
      usage >&2
      exit 1
      ;;
    *)
      TARGETS="${TARGETS}${1}"$'\n'
      shift
      ;;
  esac
done

if [ -z "$TARGETS" ]; then
  printf '没有找到要检查的文件\n' >&2
  exit 1
fi

while IFS= read -r t; do
  [ -z "$t" ] && continue
  audit_file "$t"
done <<< "$TARGETS"

printf '\n────────────────────────────────────────\n'
printf '检查 %d 个文件，其中 %d 个有问题：%s%d 个✗ 错误%s，%s%d 个⚠ 建议%s\n' \
  "$FILES" "$FILES_BAD" "$C_ERR" "$ERRORS" "$C_RST" "$C_WARN" "$WARNINGS" "$C_RST"

if [ "$ERRORS" -gt 0 ]; then
  exit 1
fi
exit 0
