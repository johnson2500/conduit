import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateTransactionEntryDto } from './transctions.dto';
import {
  Transaction,
  TransactionEntry,
  AddTransactionEntryType,
} from '../types';
import { mockTransactionData } from '../mockData';
import { AccountsService } from '../accounts/accounts.services';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TransactionsService {
  constructor(private readonly accountsService: AccountsService) {}

  transactions: Transaction[] = mockTransactionData;

  get(id: string): Transaction {
    console.log(`Fetching transaction with id: ${id}`);
    const transaction = this.transactions.find(
      (transaction) => transaction.id === id,
    );
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  all(): Transaction[] {
    console.log('Fetching all transactions');
    return this.transactions;
  }

  create(transaction: CreateTransactionEntryDto): Transaction {
    try {
      this.validateTransaction(transaction);
    } catch (error) {
      throw new BadRequestException(
        `Transaction validation failed: ${error.message}`,
      );
    }

    // All validations passed, proceed to create transaction
    const transactionToCreate: Transaction = {
      ...transaction,
      id: transaction.id || randomUUID(),
    };

    // Only now call processTransaction and push
    this.accountsService.processTransaction(transactionToCreate, {
      validateTransaction: this.validateTransaction.bind(this),
    });

    this.transactions.push(transactionToCreate);

    return transactionToCreate;
  }

  accountEntriesAreDifferentAccounts(transaction: Transaction) {
    const accountIds = transaction.entries.map((entry) => entry.account_id);
    const uniqueAccountIds = new Set(accountIds);

    return uniqueAccountIds.size === accountIds.length;
  }

  accountsExist(transaction: CreateTransactionEntryDto): boolean {
    console.log('Checking if all accounts in transaction exist');
    for (const entry of transaction.entries) {
      try {
        const account = this.accountsService.get(entry.account_id);
        if (!account) return false;
      } catch (error) {
        console.log(
          `Account with id: ${entry.account_id} does not exist. ${error}`,
        );
      }
    }
    return true;
  }

  addTransactionEntry(entry: AddTransactionEntryType): Transaction {
    console.log(`Adding transaction entry to account_id: ${entry.account_id}`);
    const newTransaction: Transaction = {
      id: (this.transactions.length + 1).toString(),
      name: `Transaction ${this.transactions.length + 1}`,
      entries: [entry],
    };

    this.transactions.push(newTransaction);

    return newTransaction;
  }

  public validateTransaction(transaction: CreateTransactionEntryDto): void {
    // 1. Validate the transaction's existence (idempotency check).
    // This is the first and most critical check.
    const existingTransaction = this.transactions.find(
      (t) => t.id === transaction.id,
    );
    if (existingTransaction) {
      throw new BadRequestException('Transaction with this ID already exists.');
    }

    // 2. Validate the integrity and balance of the transaction entries.
    // This method will throw an exception if entries are invalid.
    this.validateTransactionEntries(transaction.entries);

    // 3. Ensure all accounts referenced in the transaction exist.
    this.ensureAccountsExist(transaction.entries);
  }

  /**
   * Validates the entries within a transaction.
   * Checks for balance, positive amounts, and unique accounts.
   * @param entries The array of transaction entries.
   */
  public validateTransactionEntries(entries: TransactionEntry[]): void {
    if (!entries || entries.length < 2) {
      throw new BadRequestException(
        'A transaction must have at least two entries.',
      );
    }

    const accountIds = new Set(entries.map((entry) => entry.account_id));
    if (accountIds.size < entries.length) {
      throw new BadRequestException(
        'Transaction entries cannot be on the same account.',
      );
    }

    if (entries.some((entry) => entry.amount <= 0)) {
      throw new BadRequestException(
        'Transaction entries must have amounts greater than zero.',
      );
    }

    const totalCredit = entries
      .filter((entry) => entry.direction === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalDebit = entries
      .filter((entry) => entry.direction === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);

    if (totalCredit !== totalDebit) {
      throw new BadRequestException(
        `Transaction entries are not balanced: totalCredit=${totalCredit}, totalDebit=${totalDebit}`,
      );
    }
  }

  /**
   * Ensures all accounts specified in the transaction entries exist.
   * @param entries The array of transaction entries.
   */
  private ensureAccountsExist(entries: TransactionEntry[]): void {
    for (const entry of entries) {
      const account = this.accountsService.get(entry.account_id);
      if (!account) {
        throw new BadRequestException(
          `Account with ID '${entry.account_id}' does not exist.`,
        );
      }
    }
  }
}
