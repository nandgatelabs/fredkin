import { computeAccountBalance } from "@/db/accounts";
import { getDb } from "@/db/client";
import { createRecord } from "@/db/records";
import type { Account, MoneyRecord } from "@/db/types";
import { toIsoLocal } from "@/lib/datetime";
import { walletGap } from "@/lib/walletCheck";

function mapAccount(row: Account): Account {
  return {
    ...row,
    last_checked_balance:
      row.last_checked_balance == null ? null : Number(row.last_checked_balance),
    last_checked_at: row.last_checked_at ?? null,
  };
}

export async function saveWalletCheck(input: {
  accountId: string;
  realBalance: number;
  asOf: Date;
  absorb: boolean;
}): Promise<{ account: Account; gap: number; adjustment: MoneyRecord | null }> {
  if (Number.isNaN(input.realBalance)) {
    throw new Error("Real balance must be a number");
  }
  const db = await getDb();
  const account = await db.getFirstAsync<Account>(
    "SELECT * FROM accounts WHERE id = ?",
    input.accountId,
  );
  if (!account) throw new Error("Wallet not found");

  const appBalance = await computeAccountBalance(account.id, account.opening_balance);
  const gap = walletGap(appBalance, input.realBalance);
  const asOfIso = toIsoLocal(input.asOf);

  let adjustment: MoneyRecord | null = null;
  if (input.absorb && Math.abs(gap) >= 0.005) {
    adjustment = await createRecord({
      type: gap > 0 ? "income" : "expense",
      amount: Math.abs(gap),
      account_id: account.id,
      category_id: null,
      occurred_at: asOfIso,
      note: "Wallet check",
      is_adjustment: true,
    });
  }

  await db.runAsync(
    "UPDATE accounts SET last_checked_balance = ?, last_checked_at = ? WHERE id = ?",
    input.realBalance,
    asOfIso,
    account.id,
  );

  const updated = await db.getFirstAsync<Account>(
    "SELECT * FROM accounts WHERE id = ?",
    account.id,
  );
  if (!updated) throw new Error("Wallet not found");
  return { account: mapAccount(updated), gap, adjustment };
}
