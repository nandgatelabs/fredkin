import { formatMoney } from "@/lib/money";
import { parseOccurredAt } from "@/lib/recordsUi";

/** One-tap absorb at or below this absolute gap (currency units). */
export const WALLET_CHECK_TINY_GAP = 5;

/** Last check older than this is stale. */
export const WALLET_CHECK_STALE_MS = 14 * 24 * 60 * 60 * 1000;

export function walletGap(appBalance: number, realBalance: number): number {
  return realBalance - appBalance;
}

export function isTinyWalletGap(gap: number): boolean {
  return Math.abs(gap) > 0 && Math.abs(gap) <= WALLET_CHECK_TINY_GAP + 1e-9;
}

export function isWalletCheckStale(lastCheckedAt: string | null | undefined, now = new Date()): boolean {
  if (!lastCheckedAt) return true;
  const when = parseOccurredAt(lastCheckedAt);
  if (Number.isNaN(when.getTime())) return true;
  return now.getTime() - when.getTime() >= WALLET_CHECK_STALE_MS;
}

export function walletOffBy(appBalance: number, lastCheckedBalance: number | null | undefined): number | null {
  if (lastCheckedBalance == null || Number.isNaN(lastCheckedBalance)) return null;
  const gap = lastCheckedBalance - appBalance;
  if (Math.abs(gap) < 0.005) return 0;
  return gap;
}

export function walletCheckChip(opts: {
  balance: number;
  last_checked_balance: number | null;
  last_checked_at: string | null;
}): string | null {
  const parts: string[] = [];
  const off = walletOffBy(opts.balance, opts.last_checked_balance);
  if (off != null && off !== 0) {
    parts.push(`Off by ${formatMoney(Math.abs(off), { sign: "never" })}`);
  }
  if (opts.last_checked_at && isWalletCheckStale(opts.last_checked_at)) {
    parts.push("Stale");
  }
  return parts.length ? parts.join(" · ") : null;
}
