import {
  HttpException,
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.services';
import { Account, Transaction, Direction } from '../types';
import { CreateAccountType, UpdateAccountType } from './accounts.dto';
import { mockAccountData } from '../mockData';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AccountsService {
  private accounts: { [x: string]: Account } = mockAccountData;

  constructor(
    private readonly transactionService: TransactionsService,
    private readonly logger: Logger,
  ) {}

  get(id: string): Account {
    const account = this.accounts[id];

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    return account;
  }

  all(): Account[] {
    return Object.values(this.accounts);
  }

  create(accountData: CreateAccountType): Account {
    const data: Account = {
      id: randomUUID(),
      ...accountData,
    };

    this.accounts[data.id] = data;

    return data;
  }

  update(id: string, accountData: UpdateAccountType): Account {
    const accountToUpdate = this.get(id);

    if (!accountToUpdate) {
      throw new HttpException('Account not found', 404);
    }

    const newAccountData = {
      ...accountToUpdate,
      ...accountData,
    };

    this.accounts[id] = newAccountData;

    return newAccountData;
  }

  processTransaction(transaction: Transaction): Account[] {
    this.logger.log(`Processing transaction with id: ${transaction.id}`);
    const isValidTransaction =
      this.transactionService.validateTransaction(transaction);
    if (!isValidTransaction) {
      throw new HttpException(
        'Invalid transaction entries. Transaction entries have to sum to zero, and there must be at least 2 entries.',
        400,
      );
    }

    const effectedAccounts: Account[] = [];

    transaction.entries.forEach((entry) => {
      const account = this.get(entry.account_id);

      let newBalance = account.balance;

      if (account.direction === Direction.CREDIT) {
        if (entry.direction === Direction.CREDIT) {
          newBalance += entry.amount;
        } else {
          newBalance -= entry.amount;
        }
      } else {
        if (entry.direction === Direction.DEBIT) {
          newBalance += entry.amount;
        } else {
          newBalance -= entry.amount;
        }
      }

      this.updateAccountBalance(account.id, newBalance);

      effectedAccounts.push(this.get(account.id));
    });

    return effectedAccounts;
  }

  updateAccountBalance(id: string, newBalance: number): Account {
    const accountToUpdate = this.get(id);

    if (!accountToUpdate) {
      throw new HttpException('Account not found', 404);
    }

    const newAccountData = {
      ...accountToUpdate,
      balance: newBalance,
    };

    this.accounts[id] = newAccountData;

    return newAccountData;
  }
}
