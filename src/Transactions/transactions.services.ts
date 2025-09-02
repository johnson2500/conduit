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
    const isValid = this.validateTransaction(transaction);

    if (!isValid) {
      throw new BadRequestException('Invalid transaction data.');
    }
    // should throw BadRequestException for zero entry amount
    if (
      transaction.id &&
      this.transactions.find((t) => t.id === transaction.id)
    ) {
      throw new BadRequestException('Transaction with this ID already exists.');
    }

    if (!this.accountsExist(transaction)) {
      throw new BadRequestException('One or more accounts do not exist.');
    }

    if (!this.accountEntriesAreDifferentAccounts(transaction as Transaction)) {
      throw new BadRequestException(
        'Transaction entries cannot be on the same account.',
      );
    }

    // Ensure all referenced accounts exist
    for (const entry of transaction.entries) {
      try {
        const test = this.accountsService.get(entry.account_id);

        const accountExists = !!test;
        if (!accountExists) {
          throw new BadRequestException('One or more accounts do not exist.');
        }
      } catch (error) {
        console.log(
          `Account with id: ${entry.account_id} does not exist. Rejecting transaction. ${error}`,
        );
        throw new BadRequestException('One or more accounts do not exist.');
      }
    }

    // All validations passed, proceed to create transaction
    const transactionToCreate: Transaction = {
      ...transaction,
      id: transaction.id || randomUUID(),
    };

    // Only now call processTransaction and push
    this.accountsService.processTransaction(transactionToCreate, this);

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

  validateTransaction(transaction: CreateTransactionEntryDto): boolean {
    if (!this.validateTransactionEntries(transaction.entries)) {
      console.log(
        `Transaction entries are invalid for transaction id: ${transaction.id}`,
      );
      return false; // or throw an exception?
    }

    const existingTransaction = this.transactions.find(
      (t) => t.id === transaction.id,
    );
    if (existingTransaction) {
      console.log(
        `Transaction with id: ${transaction.id} already exists. Rejecting to ensure idempotency.`,
      );
      return false; // or throw an exception?
    }

    if (this.transactionEntriesAreSameAccount(transaction as Transaction)) {
      console.log(
        `Transaction entries cannot be on the same account for transaction id: ${transaction.id}`,
      );
      return false; // or throw an exception?
    }

    console.log(
      `Transaction with id: ${transaction.id} is valid and can be processed.`,
    );
    return true;
  }

  validateTransactionEntries(entries: TransactionEntry[]): boolean {
    console.log('Validating transaction entries');
    // A valid transaction must have equal total credits and debits
    // Basically the sum of all credit entries must equal
    // the sum of all debit entries
    const lengthIsValid = entries.length >= 2;

    if (!lengthIsValid) {
      console.log('Transaction must have at least two entries to be valid');
      return false;
    }

    const totalCredit = entries
      .filter((entry) => entry.direction === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalDebit = entries
      .filter((entry) => entry.direction === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);

    if (totalCredit !== totalDebit) {
      console.log(
        `Transaction entries are not balanced: totalCredit=${totalCredit}, totalDebit=${totalDebit}`,
      );
      return false;
    }

    if (entries.some((entry) => entry.amount <= 0)) {
      console.log('Transaction entries must have amounts greater than zero');
      return false;
    }

    return totalCredit === totalDebit;
  }

  transactionEntriesAreSameAccount(transaction: Transaction) {
    const account1 = transaction.entries[0].account_id;
    const account2 = transaction.entries[1].account_id;

    return account1 === account2;
  }
}
