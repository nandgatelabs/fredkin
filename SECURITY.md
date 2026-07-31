# Security Policy

money-money is an offline personal finance app. Treat ledger data, backups, and exports as sensitive.

## Supported versions

Security fixes are applied on the latest `main` until versioned releases exist. After releases ship, the latest release line is supported.

## Reporting a vulnerability

**Do not open a public GitHub issue for security problems.**

Email **gshivamrut@gmail.com** with:

- A short description of the issue
- Steps to reproduce (or proof-of-concept)
- Impact (e.g. data exposure, backup overwrite, local file access)
- Your preferred contact for follow-up

You should get an acknowledgement within a few days. Please give us a reasonable window to investigate and fix before public disclosure.

## Scope notes

In scope (examples):

- Unsafe handling of backups / restore that can destroy or leak data without clear consent
- Path traversal or arbitrary file write via import/export
- Local passcode / lock bypass once that feature lands
- Secrets accidentally committed to the repository

Out of scope (examples):

- Physical access to an unlocked device
- Compromised OS / malware on the user’s phone
- Social engineering of maintainers

## Safe contribution hygiene

- Never commit real ledgers, `.mbak` backups, or personal CSVs (`private/` is gitignored).
- Do not include production secrets or API keys in PRs.
- Prefer minimal reproduction data in bug reports (synthetic amounts/names).
