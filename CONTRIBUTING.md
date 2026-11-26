# Contributing

1. Define a delivery Issue and checkable subtask acceptance criteria.
2. Start one isolated `codex/feature/<topic>` branch from current origin/main; preserve unrelated working trees.
3. Agent implements and integrates small tasks in this feature branch. Reference task Issues in commits; optional local task branches do not require GitHub PRs.
4. Run local lint/test/build and feature push CI; resolve conflicts by intent and verify the integrated result. Record previews for visible changes.
5. At phase completion, open one feature → main PR listing the completed tasks, verification, compatibility and rollback plan.
6. Agent hands off the PR after current-head quality checks pass. The maintainer reviews the overall result and clicks Merge on the PR page; there is no separate environment approval, approval label or SHA-entry step. Agent does not merge or enable auto-merge.
7. The maintainer may use squash merge; verify an authorized deployment separately. Revert with a new change rather than rewriting main.

See [the delivery guide](docs/agent-workflow.md). Do not mix unrelated legacy changes, local media, credentials or generated output into a delivery.
