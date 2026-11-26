# Repository instructions

## Workflow and authorization

- Work on one Issue in a short-lived `codex/issue-<number>-<topic>` branch and isolated worktree. Preserve other checkouts and their staging.
- Read `CONTRIBUTING.md` and `docs/agent-workflow.md`. Issue acceptance criteria define scope; labels are not permission.
- Resolve conflicts on the task branch by preserving both changes' intended behavior, then rerun checks. Never choose an entire side blindly. Escalate conflicting product intent.
- Low-risk docs and base-policy-authorized tasks may merge only through the trusted controller after current-SHA checks. All global/configuration/dependency/workflow changes require maintainer acceptance.
- Do not bypass protection, forge commit statuses, dismiss reviews, change your own authorization, weaken tests or install credentials to obtain a merge.
- No force pushes or direct pushes to main. The foundational policy PR itself is high risk and must be reviewed by the maintainer.

## Verification

- Node 24; `npm ci --ignore-scripts`, `npm run lint:agent`, `npm run test:agent`, `npm run check:build`.
- Lint covers automation code plus YAML/JSON/EJS syntax. It does not claim to lint all legacy JS or verify product semantics. Add behavior tests for code changes and desktop/mobile evidence for visible changes.
- PR checks never receive deployment credentials. Trusted control workflows must load default-branch code and never run PR code, scripts, dependencies or artifacts.

## Blog invariants

- Posts: `source/_posts/`; paper category `Papers pile or pie?`, tag `论文阅读`.
- Keep URLs and Giscus pathname mapping compatible. Credentials stay in private local configuration. Local images/PDFs/manifests belong in ignored `tools/blog-assets/`, with public COS URLs in posts.
- Do not deploy source/main until it is reconciled with the current live site. `SITE_AUTO_DEPLOY` is a separate maintainer opt-in.
