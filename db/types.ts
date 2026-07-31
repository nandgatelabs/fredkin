export type CategoryType = "income" | "expense";
export type RecordType = "expense" | "income" | "transfer";

export type Account = {
  id: string;
  name: string;
  icon_key: string;
  opening_balance: number;
  sort_order: number;
  archived: number;
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
