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

export type Totals = {
  expenseSoFar: number;
  incomeSoFar: number;
  allAccountsBalance: number;
};
