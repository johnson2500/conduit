import { Account, Transaction } from './types';
import { Direction } from './types';

export const mockTransactionData: Transaction[] = [
  {
    id: '123-abc',
    name: 'Main Account',
    entries: [
      {
        account_id: '1',
        amount: 100,
        direction: 'credit',
      },
      {
        account_id: '2',
        amount: 100,
        direction: 'debit',
      },
    ],
  },
  {
    id: '456-def',
    name: 'Savings Account',
    entries: [
      {
        account_id: '1',
        amount: 200,
        direction: 'credit',
      },
      {
        account_id: '2',
        amount: 200,
        direction: 'debit',
      },
    ],
  },
];

export const mockAccountData: { [x: string]: Account } = {
  '1': {
    id: '1',
    name: 'Primary Account',
    balance: 100,
    direction: Direction.DEBIT,
  },
  '2': {
    id: '2',
    name: 'Secondary Account',
    balance: 200,
    direction: Direction.CREDIT,
  },
};
