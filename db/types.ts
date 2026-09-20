import type { PersonRole } from "@/lib/personRole";

export type CategoryType = "income" | "expense";
export type RecordType = "expense" | "income" | "transfer";

export type Person = {
  id: string;
  name: string;
  note: string;
  archived: number;
  converted_from_account_id: string | null;
};

export type Account = {
  id: string;
  name: string;
  icon_key: string;
  opening_balance: number;
  sort_order: number;
  archived: number;
  last_checked_balance: number | null;
  last_checked_at: string | null;
};

export type AccountWithBalance = Account & {
  balance: number;
};

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon_key: string;
  color: string | null;
  sort_order: number;
  archived: number;
};

export type MoneyRecord = {
  id: string;
  type: RecordType;
  amount: number;
  category_id: string | null;
  account_id: string;
  to_account_id: string | null;
  note: string;
  occurred_at: string;
  person_id: string | null;
  person_role: PersonRole | null;
  is_adjustment: number;
};

export type Totals = {
  expenseSoFar: number;
  incomeSoFar: number;
  allAccountsBalance: number;
};

export type Budget = {
  id: string;
  category_id: string;
  year: number;
  month: number;
  limit_amount: number;
};
