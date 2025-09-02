import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.services';
import { Logger, BadRequestException } from '@nestjs/common';
import { Direction } from '../types';
import { AccountsService } from '../accounts/accounts.services';
import { CreateTransactionEntryDto } from './transctions.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsServiceMock: any;
  let accountsServiceMock: any;

  beforeEach(async () => {
    transactionsServiceMock = {
      validateTransactionEntries: jest.fn().mockReturnValue(true),
      create: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      addTransactionEntry: jest.fn(),
    };

    accountsServiceMock = {
      processTransaction: jest.fn().mockReturnValue([
        {
          id: '1',
          name: 'Account 1',
          balance: 500,
          direction: Direction.CREDIT,
        },
        {
          id: '2',
          name: 'Account 2',
          balance: 500,
          direction: Direction.DEBIT,
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: AccountsService, useValue: accountsServiceMock },
        { provide: TransactionsService, useValue: transactionsServiceMock },
        Logger,
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- GET Endpoint Tests ---

  describe('getTransactionById', () => {
    it('should return a transaction for a valid ID', () => {
      transactionsServiceMock.get.mockReturnValueOnce({
        id: '1',
        name: 'Test Transaction',
        entries: [],
      });
      const transaction = controller.getTransactionById('1');
      expect(transaction).toBeDefined();
      expect(transactionsServiceMock.get).toHaveBeenCalledWith('1');
    });

    it('should handle a non-existent transaction', () => {
      transactionsServiceMock.get.mockImplementationOnce(() => {
        throw new Error('Transaction not found');
      });
      expect(() => controller.getTransactionById('non-existent-id')).toThrow(
        'Transaction not found',
      );
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', () => {
      transactionsServiceMock.all.mockReturnValueOnce([
        { id: '1', name: 'Test Transaction', entries: [] },
      ]);
      const transactions = controller.getAllTransactions();
      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  // --- POST Endpoint Tests (including edge cases) ---

  describe('createTransaction', () => {
    it('should successfully process a valid, balanced transaction', () => {
      const validData: CreateTransactionEntryDto = {
        name: 'Valid Transaction',
        entries: [
          { account_id: '1', amount: 500, direction: Direction.CREDIT },
          { account_id: '2', amount: 500, direction: Direction.DEBIT },
        ],
      };

      const createdTransaction = { id: 'mock-id', ...validData };
      transactionsServiceMock.create.mockReturnValue(createdTransaction);

      const result = controller.createTransaction(validData);

      expect(transactionsServiceMock.create).toHaveBeenCalledWith(validData);
      // expect(accountsServiceMock.processTransaction).toHaveBeenCalled();
      expect(!!result).toBe(true);
    });

    // --- Edge Cases ---

    it('should reject a transaction with invalid data (e.g., non-existent account)', () => {
      const invalidData: CreateTransactionEntryDto = {
        name: 'Invalid Transaction',
        entries: [
          {
            account_id: 'non-existent-id',
            amount: 100,
            direction: Direction.DEBIT,
          },
          { account_id: '2', amount: 100, direction: Direction.CREDIT },
        ],
      };

      transactionsServiceMock.create.mockImplementation(() => {
        throw new BadRequestException('Transaction entries are not valid');
      });

      expect(() => controller.createTransaction(invalidData)).toThrow(
        BadRequestException,
      );
    });

    it('should enforce idempotency by rejecting duplicate IDs', () => {
      const transactionWithId: CreateTransactionEntryDto = {
        id: 'passed-id', // Simulating a client-provided ID
        name: 'First Transaction',
        entries: [
          { account_id: '1', amount: 100, direction: Direction.DEBIT },
          { account_id: '2', amount: 100, direction: Direction.CREDIT },
        ],
      };

      // First call succeeds
      transactionsServiceMock.create.mockReturnValueOnce({
        id: 'passed-id',
        ...transactionWithId,
      });
      controller.createTransaction(transactionWithId);

      // Second call with the same ID should fail
      transactionsServiceMock.create.mockImplementationOnce(() => {
        throw new BadRequestException('Transaction ID already exists.');
      });

      expect(() => controller.createTransaction(transactionWithId)).toThrow(
        BadRequestException,
      );
    });
  });
});
