# Pending features

Product backlog for ledger work after v1. Process and release still live in [`ROADMAP.md`](../ROADMAP.md). Specs here are additive: keep spend / income / transfer, stay offline, no paywall.

Do not treat this as a rewrite of wallets into a double-entry graph.

| Feature | Status | Notes |
|---------|--------|--------|
| Sticky event date | **Shipped (this slice)** | Composer remembers last **new** event date |
| Wallet check + adjustment | **Shipped (this slice)** | Reconcile vs real cash/bank without fake spend/income |
| Occasions | **Shipped (this slice)** | Optional folder around events; group existing |
| Occasions spanning days | Pending | Trip/outing across more than one calendar day ([#52](https://github.com/nandgatelabs/fredkin/issues/52)) |
| Drag event to another date | Pending | Native: drop an event on a different day; date updates, time stays ([#53](https://github.com/nandgatelabs/fredkin/issues/53)) |
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

**Behavior (implemented):**

- On a wallet: **Check wallet** — enter **real** balance (as-of date/time).
- Show App vs Real vs Gap.
- **Add missing events** (leave gap as a warning) or **Absorb** into an **Adjustment** that does **not** count as spend or income.
- Store last checked balance + time; **Off by** / **Stale** (14 days) chips on the wallet list.
- Tiny cash gaps (≤ ₹5) may one-tap absorb; larger gaps should prefer logging missing events.

---

## Occasions

**Problem:** Related lines (lunch, auto, metro) repeat place names in every note.

**Behavior (implemented):**

- Optional. **+** still adds a normal event.
- Create from scratch: native **long-press +**, web **circled +** beside +, More → New occasion. Title + date; Save & add event, or save an empty folder.
- Group existing events (same-day picker, including occasions already on that day) from an event’s detail or from an occasion.
- Events list collapses an occasion to title · count · spend (coral) / income (green); expand to members.
- Native only: long-press an event, then drag onto an occasion folder to attach; drag a member off the folder (drop on empty space) to unlink. Swipe still edits/deletes. Not on web.
- Composer stays on the occasion after Save so another line can be added.
- Delete occasion unlinks members (events stay). Not for SIPs, salary, or card bills.

---

## Drag event to another date

**Problem:** A line on the wrong day means opening the composer just to change the date.

**Direction:**

- **Native only** (same idea as dragging into an occasion). Web keeps the composer.
- Long-press an event, drop it on another **date section** in Events. The event’s calendar day becomes that section’s day; **time of day is unchanged**.
- Dropping on empty space in a day (not on an occasion folder) still means that day.
- Occasion drag stays: drop on a folder to attach; drop off a folder to unlink. Date-move is a separate drop target (the day header / that day’s list).
- Adjustments can move days like any other event. Do not invent a new record; only update `occurred_at`.

---

## Occasions spanning days

**Problem:** A trip or wedding can run across several calendar days; today’s occasion is one date.

**Direction:**

- One occasion can cover a date range, not only a single day.
- Events on any day in the range can join that folder.
- Events list still collapses to one row (show the span in the subtitle).
- Stay optional; do not force every event into an occasion.

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
