#!/usr/bin/env bash
# Collect the git context needed to write a commit message.
# Read-only: never stages, commits, or modifies anything.
set -euo pipefail

MAX_BYTES="${MAX_BYTES:-40000}"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "ERROR: not inside a git repository." >&2
  exit 1
fi

section() { printf '\n===== %s =====\n' "$1"; }

section "BRANCH"
git branch --show-current || true

section "STAGED FILES (index vs HEAD)"
if git diff --cached --quiet; then
  echo "(no staged changes)"
else
  git diff --cached --stat
fi

section "UNSTAGED TRACKED FILES (worktree vs index)"
if git diff --quiet; then
  echo "(no unstaged changes)"
else
  git diff --stat
fi

section "UNTRACKED FILES"
untracked="$(git ls-files --others --exclude-standard)"
if [ -z "$untracked" ]; then
  echo "(no untracked files)"
else
  printf '%s\n' "$untracked"
fi

section "STAGED DIFF"
if git diff --cached --quiet; then
  echo "(no staged diff)"
else
  git diff --cached --unified=3 | head -c "$MAX_BYTES"
  echo
fi

section "UNSTAGED DIFF"
if git diff --quiet; then
  echo "(no unstaged diff)"
else
  git diff --unified=3 | head -c "$MAX_BYTES"
  echo
fi

section "RECENT COMMIT STYLE (last 15)"
git --no-pager log --oneline -15 || true
