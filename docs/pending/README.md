# Pending features

Product backlog for ledger work after v1. Process and release still live in [`ROADMAP.md`](../ROADMAP.md). Specs here are additive: keep spend / income / transfer, stay offline, no paywall.

Do not treat this as a rewrite of wallets into a double-entry graph.

| Feature | Status | Notes |
|---------|--------|--------|
| Sticky event date | **Shipped (this slice)** | Composer remembers last **new** event date |
| Wallet check + adjustment | Pending | Kill fake “balance discrepancy” income/spend |
| Occasions | Pending | Group related events (outing / trip) |
| People (gift vs claim) | **Shipped (this slice)** | Optional person + roles; wallet convert |

---

## Sticky event date

**Problem:** Backfilling a missed day means changing the date on every new event.

**Behavior (implemented):**

- New events reuse the last **saved date and time** (`lastNewEventOccurredAt`). No 14-day or same-month cutoff.
- Editing an existing event does not read or write that memory.
- Footer: **date · time · Today**. Today jumps to now (and updates memory on new events).
- Confirming date/time pickers on a **new** event updates memory even if Discard follows.
- Date picker is a month **calendar** (tap day to set; month chevrons; tap title for year). Same control on web and native so Expo web is not left on a native-only OS picker.

---

## Wallet check + adjustment

**Problem:** Ledger vs cash/bank drift is “fixed” with fake Refunds/Awards/Bills rows named discrepancy. That poisons Insights.

**Direction:**

- On a wallet: enter **real** balance (optional as-of).
- Show App vs Real vs Gap.
- **Add missing events** (leave gap as a warning) or **Absorb** into an **Adjustment** that does **not** count as spend or income.
- Store last checked balance + time; show stale / off-by chips.
- Tiny cash gaps (e.g. under ₹5) may one-tap absorb; larger gaps should prefer logging missing events.

---

## Occasions

**Problem:** Related lines (lunch, auto, metro) repeat place names in every note.

**Direction:**

- Occasion = folder around **normal** events (not one merged Food row).
- Title, date, optional people; members keep type / category / wallet / amount.
- Composer: stay in occasion to add another line.
- Events list: collapse to one row with total + count; expand to members.
- Attach existing same-day rows later. Delete occasion unlinks by default.
- Not for SIPs, salary, or card bills.

---

## People (gift vs claim)

**Problem:** Names live in notes; **Loan** is spend; gifts and IOUs are mixed.

**Direction:**

- People ≠ wallets. Wallets are where **your** money sits.
- Optional people on an event, with a **role**: *with / gift* (still spend or income) vs *they owe you / you owe them* (claim; excluded from SPEND like a transfer) vs *settled*.
- Person screen: **spent on them** vs **open claims** as two stacks, never one blended number. They-owe / you-owe follow the role (spend or income); settled income pays they-owe, settled spend pays you-owe.
- Default role from category (Gift → gift, Loan → they owe you) with a one-tap override.
- Shared lunch + person *with* is not a loan unless you mark a claim.

---

## Out of scope here

SMS parsing, Account Aggregator, payment apps, cloud sync, paywalls.
