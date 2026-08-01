# Contributing

Canonical remote: [nandgatelabs/fredkin](https://github.com/nandgatelabs/fredkin)

Owner org: **nandgatelabs**. Use **GitHub CLI (`gh`)** for branches, PRs, and merges. Do not push straight to `main` for normal work.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues via [SECURITY.md](SECURITY.md), not public issues.

## Workflow

```
main (PR required; no direct pushes)
  └── feature/<short-name>  →  PR  →  review / CI  →  merge into main
```

### 1. Start from an up-to-date main

```bash
git checkout main
git pull origin main
git checkout -b feature/<short-name>
```

Branch naming:

| Prefix | Use |
|--------|-----|
| `feature/` | New capability or vertical slice |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `chore/` | Tooling, deps, repo hygiene |

### 2. Commit with intent

- Prefer **small, focused commits** that each leave the tree coherent.
- **Required:** every commit subject starts with an intent prefix (`type: summary`).
- Optional body after a blank line: 1–2 sentences on **why**.

| Prefix | Intent |
|--------|--------|
| `feat:` | New user-facing capability |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Internal restructure, no behavior change |
| `chore:` | Tooling, deps, repo hygiene |
| `test:` | Tests only |
| `perf:` | Performance improvement |
| `style:` | Formatting / non-semantic code style |

Examples:

```text
feat: add period range helpers for monthly and yearly views

Centralizes date math so Records and Analysis share one source of truth.
```

```text
docs: clarify backup restore confirmation flow
```

```text
fix: correct transfer balance when from and to are swapped
```

Squash-merge PR titles should keep the same prefix style when practical (e.g. `docs: … (#12)`).

Do not commit `private/`, `.env*`, secrets, or real ledgers.

### 3. Open an elaborate PR with `gh`

```bash
git push -u origin HEAD
gh pr create --title "Clear outcome-focused title" --body "$(cat <<'EOF'
## Summary
- What changed
- Why it matters

## Test plan
- [ ] How to verify (commands, screens, edge cases)

## Notes
- Follow-ups, risks, or doc links (HLD / BLUEPRINT sections)
EOF
)"
```

PR body should be enough for a future reader (or agent) to understand the change without the chat history.

### 4. Merge via PR (maintainer only, after testing)

**Do not merge until a maintainer has tried the change (usability) and explicitly approves merge.**

Agents and contributors: open the PR and wait. Maintainers merge only after a go-ahead.

```bash
gh pr merge --squash   # default preference for this repo
# or: gh pr merge --merge   when preserving commit history matters
```

After merge:

```bash
git checkout main
git pull origin main
git branch -d feature/<short-name>   # optional local cleanup
```

## Docs as part of the change

If behavior or architecture changes, update the matching source of truth in the **same PR**:

- [`docs/HLD.md`](docs/HLD.md) — architecture, data, phases  
- [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) — screens / product behavior  
- [`CHANGELOG.md`](CHANGELOG.md) — user-facing notes under `[Unreleased]` when shipping behavior  
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — only when priorities / milestones change  
- [`AGENTS.md`](AGENTS.md) — agent hard rules  

## Releases (maintainers)

Versioning and cutting GitHub Releases: [`docs/VERSIONING.md`](docs/VERSIONING.md) and [`docs/RELEASE.md`](docs/RELEASE.md).

```bash
npm run version:set -- X.Y.Z   # sync package.json, app.json, desktop/
```

## Agents

AI agents **must** follow this workflow: feature branch → commits → `gh pr create` → wait for explicit merge approval. See [`AGENTS.md`](AGENTS.md).
