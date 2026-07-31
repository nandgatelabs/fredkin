# Contributing

Canonical remote: [nandgatelabs/money-money](https://github.com/nandgatelabs/money-money)

Owner org: **nandgatelabs**. Use **GitHub CLI (`gh`)** for branches, PRs, and merges. Do not push straight to `main` for normal work.

## Workflow

```
main (protected by convention)
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
- Message style: short summary line, then a blank line and 1–2 sentences on **why** when useful.
- Example:

```text
Add period range helpers for monthly and yearly views.

Centralizes date math so Records and Analysis share one source of truth.
```

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

### 4. Merge via PR

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
- [`AGENTS.md`](AGENTS.md) — agent hard rules  

## Agents

AI agents **must** follow this workflow: feature branch → commits → `gh pr create` → merge. See [`AGENTS.md`](AGENTS.md).
