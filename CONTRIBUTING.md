# Contributing

1. Open an Issue describing the problem, intended behavior, scope and acceptance criteria.
2. Start from current `origin/main` in an isolated branch/worktree. Commit only related changes.
3. Open a Draft PR early, link `Fixes #<issue>`, describe validation and include previews for UI changes.
4. Run the checks in `AGENTS.md`; resolve conflicts and review findings. Every new commit invalidates prior SHA-specific acceptance.
5. Low-risk and explicitly authorized tasks may use the trusted controller. Other work needs the maintainer workflow and manual merge.
6. Prefer squash merge. Verify the deployed page if deployment was authorized. Revert a faulty merge with a new PR rather than rewriting main.

See [the risk policy and activation guide](docs/agent-workflow.md). Do not silently include legacy working-tree changes, local media, credentials or generated output.
