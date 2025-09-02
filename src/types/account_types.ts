export enum Direction {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export type Account = {
  id: string;
  name: string;
  balance: number;
  direction: Direction;
};

// I just chose this cause it's fast to access in memory rather
// than an array search every time
export const Accounts: { [x: string]: Account } = {};
