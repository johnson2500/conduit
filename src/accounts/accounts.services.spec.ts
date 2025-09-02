import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.services';
import { TransactionsService } from '../transactions/transactions.services';
import { Logger } from '@nestjs/common';
import { CreateAccountType, UpdateAccountType } from './accounts.dto';
import { Direction, Transaction } from '../types';

describe('AccountsService', () => {
  let service: AccountsService;

  let transactionsServiceMock: any;

  beforeEach(async () => {
    transactionsServiceMock = {
      validateTransactionEntries: jest.fn().mockReturnValue(true),
      create: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      addTransactionEntry: jest.fn(),
      validateTransaction: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Logger,
        AccountsService,
        {
          provide: TransactionsService,
          useValue: transactionsServiceMock,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an account', () => {
      const accountData: CreateAccountType = {
        name: 'Test Account',
        balance: 1000,
        direction: Direction.CREDIT,
      };
      const account = service.create(accountData);

      expect(account).toHaveProperty('id');
      expect(account.name).toBe(accountData.name);
      expect(account.balance).toBe(accountData.balance);
      expect(account.direction).toBe(accountData.direction);
    });
  });

  describe('get', () => {
    it('should get an account by id', () => {
      const accountData: CreateAccountType = {
        name: 'Test Account',
        balance: 1000,
        direction: Direction.CREDIT,
      };
      const createdAccount = service.create(accountData);
      const fetchedAccount = service.get(createdAccount.id);
      expect(fetchedAccount).toEqual(createdAccount);
    });

    it('should throw an error if account not found', () => {
      expect(() => service.get('non-existent-id')).toThrow('Account not found');
    });
  });

  describe('all', () => {
    it('should return all accounts', () => {
      const accountData1: CreateAccountType = {
        name: 'Test Account 1',
        balance: 1000,
        direction: Direction.CREDIT,
      };

      const accountData2: CreateAccountType = {
        name: 'Test Account 2',
        balance: 2000,
        direction: Direction.DEBIT,
      };

      const createdAccount1 = service.create(accountData1);
      const createdAccount2 = service.create(accountData2);

      const allAccounts = service.all();

      expect(allAccounts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdAccount1.id }),
          expect.objectContaining({ id: createdAccount2.id }),
        ]),
      );
      expect(allAccounts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('update', () => {
    it('should update an existing account', () => {
      const accountData: CreateAccountType = {
        name: 'Test Account',
        balance: 1000,
        direction: Direction.CREDIT,
      };
      const createdAccount = service.create(accountData);
      const updateData: UpdateAccountType = {
        name: 'Updated Account',
      };
      const updatedAccount = service.update(createdAccount.id, updateData);

      expect(updatedAccount.name).toBe(updateData.name);
      expect(updatedAccount.direction).toBe(createdAccount.direction);
      expect(updatedAccount.id).toBe(createdAccount.id);

      const fetchedAccount = service.get(createdAccount.id);

      expect(fetchedAccount).toEqual(updatedAccount);
    });

    it('should throw an error if account to update is not found', () => {
      const updateData: UpdateAccountType = {
        name: 'Updated Account',
      };
      expect(() => service.update('non-existent-id', updateData)).toThrow(
        'Account not found',
      );
    });
  });

  describe('processTransactionEntries', () => {
    it('should process transaction entries and update account balances', () => {
      const accountData1: CreateAccountType = {
        name: 'Account 1',
        balance: 1000,
        direction: Direction.CREDIT,
      };
      const accountData2: CreateAccountType = {
        name: 'Account 2',
        balance: 2000,
        direction: Direction.DEBIT,
      };
      const createdAccount1 = service.create(accountData1);
      const createdAccount2 = service.create(accountData2);

      const transaction: Transaction = {
        id: 'txn-1',
        name: 'Test Transaction',
        entries: [
          {
            account_id: createdAccount1.id,
            amount: 200,
            direction: Direction.CREDIT,
          },
          {
            account_id: createdAccount2.id,
            amount: 100,
            direction: Direction.DEBIT,
          },
        ],
      };

      service.processTransaction(transaction, transactionsServiceMock);

      const updatedAccount1 = service.get(createdAccount1.id);
      const updatedAccount2 = service.get(createdAccount2.id);

      // For CREDIT account, CREDIT entry increases balance: 1000 + 200 = 1200
      expect(updatedAccount1.balance).toBe(1200);
      // For DEBIT account, DEBIT entry increases balance: 2000 + 100 = 2100
      expect(updatedAccount2.balance).toBe(2100);
    });

    it('should throw an error for invalid transaction entries', () => {
      transactionsServiceMock.validateTransactionEntries.mockReturnValueOnce(
        false,
      );

      transactionsServiceMock.validateTransaction.mockReturnValueOnce(false);

      const accountData1: CreateAccountType = {
        name: 'Account 1',
        balance: 1000,
        direction: Direction.CREDIT,
      };
      const account1 = service.create(accountData1);

      const invalidTransaction = {
        id: 'txn-2',
        name: 'Invalid Transaction',
        amount: 300,
        entries: [
          {
            account_id: account1.id,
            amount: 200,
            direction: Direction.CREDIT,
          },
        ],
      };

      expect(() =>
        service.processTransaction(invalidTransaction, transactionsServiceMock),
      ).toThrow(
        'Invalid transaction entries. Transaction entries have to sum to zero, and there must be at least 2 entries.',
      );
    });
  });
});
