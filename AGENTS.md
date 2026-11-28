# Repository instructions

## Delivery workflow and authorization

- One delivery phase uses one isolated `codex/feature/<topic>` branch, linked to a parent Issue. Preserve other checkouts and staging.
- Read CONTRIBUTING.md and docs/agent-workflow.md. Track small tasks in Issues and commits; do not create one main PR per small task.
- Within the agreed feature scope, Agent may commit small changes, integrate local task branches, resolve conflicts and push the feature branch after verification. Product-intent conflicts or scope expansion go to the maintainer.
- Resolve conflicts by preserving both intended behaviors. Never choose an entire side blindly; rerun regression checks after integration.
- At delivery, open ONE feature → main PR with the task summary, tests, previews, compatibility and rollback evidence. Agent stops at PR handoff; the maintainer decides and performs the merge.
- No direct/force pushes to main, automatic merge, or enabling PR auto-merge. Do not invoke merge APIs on behalf of the maintainer as part of normal delivery.
- No separate agent/policy status, protected-environment acceptance, approval label or manual SHA submission is required. Keep quality checks and ordinary PR discussion.
- Do not bypass protection, forge statuses, dismiss reviews, weaken quality checks or install credentials to obtain a merge. Repository-setting changes require explicit maintainer instruction.

## Verification

- Node 24; `npm ci --ignore-scripts`, `npm run lint:agent`, `npm run test:agent`, `npm run check:build`.
- Feature pushes and main delivery PRs run the same quality CI. Keep current-head checks green before handing off.
- Automation ESLint, YAML/JSON/EJS and changed-JavaScript syntax checks do not replace behavior or visual review. Add behavior coverage and desktop/mobile evidence as appropriate.
- PR/feature checks have read-only tokens and no deployment credentials. They validate the code and cannot approve or merge the PR.

## Blog invariants

- For daily algorithm solutions, read `docs/guides/daily-solution-writing.md` before drafting or editing. Use its flexible structure and keep code readable; detailed topic summaries have their own scope.
- Posts: source/_posts/; paper category `Papers pile or pie?`, tag `论文阅读`.
- Preserve URLs and Giscus pathname mapping. Credentials stay private; images/PDFs/manifests stay in ignored tools/blog-assets/, and posts use public COS URLs.
- SITE_AUTO_DEPLOY is a separate maintainer opt-in. Never deploy source/main until its alignment with the live site is verified.
