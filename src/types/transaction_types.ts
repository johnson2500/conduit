export type Transaction = {
  id: string;
  name: string;
  entries: TransactionEntry[];
};

export type TransactionEntry = {
  account_id: string;
  amount: number;
  direction: 'credit' | 'debit';
};

export type CreateTransactionType = Omit<Transaction, 'id'>;

export type AddTransactionEntryType = {
  account_id: string;
  amount: number;
  direction: 'credit' | 'debit';
};
