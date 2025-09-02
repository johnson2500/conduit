jest.mock('../accounts/accounts.services', () => {
  return {
    AccountsService: jest.fn().mockImplementation(() => ({
      processTransaction: jest.fn(),
    })),
  };
});
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from '../accounts/accounts.services';
import { TransactionsService } from './transactions.services';
import { TransactionEntry } from '../types';
import { CreateTransactionEntryDto } from './transctions.dto';
import { BadRequestException } from '@nestjs/common';
import { TransactionsModule } from './transactions.module';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let accountsService: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TransactionsModule],
      providers: [AccountsService, TransactionsService],
    })
      .overrideProvider(AccountsService)
      .useValue({
        processTransaction: jest.fn(),
        // Mock a findById method for account existence checks
        get: jest.fn().mockImplementation((id: string) => {
          if (['1', '2', '3', '4', 'existing-account'].includes(id)) {
            return {
              id,
              name: `Test Account ${id}`,
              balance: 0,
              direction: id === '1' || id === '3' ? 'debit' : 'credit',
            };
          }
          throw new Error('Account not found');
        }),
      })
      .compile();

    service = module.get<TransactionsService>(TransactionsService);
    accountsService = module.get<AccountsService>(AccountsService);

    (service as any).transactions = [];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a valid transaction and call AccountsService', () => {
      jest.spyOn(service, 'accountsExist').mockReturnValue(true);

      const transactionData: CreateTransactionEntryDto = {
        name: 'Test Transaction',
        entries: [
          { account_id: '1', amount: 1000, direction: 'credit' },
          { account_id: '2', amount: 1000, direction: 'debit' },
        ],
      };

      const transaction = service.create(transactionData);

      expect(transaction).toHaveProperty('id');
      expect(transaction.name).toBe(transactionData.name);
      expect(transaction.entries).toEqual(transactionData.entries);
      expect(accountsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: transaction.id,
          name: transactionData.name,
        }),
        expect.any(Object),
      );
    });

    // --- Edge Cases for `create` method ---

    it('should throw BadRequestException for an unbalanced transaction', () => {
      // The service's own `validateTransactionEntries` handles this, no need for mocks
      const unbalancedData: CreateTransactionEntryDto = {
        name: 'Unbalanced Transaction',
        entries: [
          { account_id: '1', amount: 100, direction: 'credit' },
          { account_id: '2', amount: 50, direction: 'debit' },
        ],
      };

      expect(() => service.create(unbalancedData)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for a transaction with no entries', () => {
      const noEntriesData: CreateTransactionEntryDto = {
        name: 'Empty Transaction',
        entries: [],
      };
      expect(() => service.create(noEntriesData)).toThrow(BadRequestException);
    });

    it('should reject a transaction if a referenced account does not exist', () => {
      const dataWithNonExistentAccount: CreateTransactionEntryDto = {
        name: 'Invalid Account Transaction',
        entries: [
          {
            account_id: 'non-existent-id',
            amount: 100,
            direction: 'credit',
          },
          { account_id: '2', amount: 100, direction: 'debit' },
        ],
      };

      expect(() => service.create(dataWithNonExistentAccount)).toThrow(
        BadRequestException,
      );
      expect(accountsService.processTransaction).not.toHaveBeenCalled();
    });

    it('should reject a transaction if a provided ID already exists (idempotency)', () => {
      const transactionDataWithId: CreateTransactionEntryDto = {
        id: 'existing-id', // Simulating a client-provided ID
        name: 'Transaction A',
        entries: [
          { account_id: '1', amount: 100, direction: 'debit' },
          { account_id: '2', amount: 100, direction: 'credit' },
        ],
      };
      (service as any).transactions.push(transactionDataWithId);

      expect(() => service.create(transactionDataWithId)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('get', () => {
    it('should get a transaction by id', () => {
      jest.spyOn(service, 'accountsExist').mockReturnValue(true);

      const createdTransaction = service.create({
        name: 'Test Get',
        entries: [
          { account_id: '1', amount: 100, direction: 'debit' },
          { account_id: '2', amount: 100, direction: 'credit' },
        ],
      });
      const fetchedTransaction = service.get(createdTransaction.id);
      expect(fetchedTransaction).toEqual(createdTransaction);
    });

    it('should throw an error if transaction not found', () => {
      expect(() => service.get('non-existent-id')).toThrow(
        'Transaction not found',
      );
    });
  });

  describe('all', () => {
    it('should return all transactions', () => {
      jest.spyOn(service, 'accountsExist').mockReturnValue(true);

      service.create({
        name: 'Tx1',
        entries: [
          { account_id: '1', amount: 1, direction: 'debit' },
          { account_id: '2', amount: 1, direction: 'credit' },
        ],
      });
      service.create({
        name: 'Tx2',
        entries: [
          { account_id: '3', amount: 2, direction: 'debit' },
          { account_id: '4', amount: 2, direction: 'credit' },
        ],
      });
      const allTransactions = service.all();
      expect(allTransactions.length).toBe(2);
      expect(allTransactions[0].name).toBe('Tx1');
      expect(allTransactions[1].name).toBe('Tx2');
    });
  });

  describe('validateTransactionEntries', () => {
    it('should return true for a balanced transaction', () => {
      const balancedEntries: TransactionEntry[] = [
        { account_id: '1', amount: 50, direction: 'debit' },
        { account_id: '2', amount: 50, direction: 'credit' },
      ];
      try {
        const rest = service.validateTransactionEntries(balancedEntries);
        expect(rest).toBeUndefined();
      } catch (err) {
        expect(err).toBeUndefined();
      }
    });

    it('should return false for an unbalanced transaction', () => {
      const unbalancedEntries: TransactionEntry[] = [
        { account_id: '1', amount: 50, direction: 'debit' },
        { account_id: '2', amount: 60, direction: 'credit' },
      ];

      try {
        service.validateTransactionEntries(unbalancedEntries);
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
      }
    });

    it('should return false for a transaction with a single entry', () => {
      const singleEntry: TransactionEntry[] = [
        { account_id: '1', amount: 50, direction: 'debit' },
      ];
      try {
        service.validateTransactionEntries(singleEntry);
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('edge cases and validation', () => {
    it('should auto-generate an id for a transaction if not provided', () => {
      jest.spyOn(service, 'accountsExist').mockReturnValue(true);
      const transactionData: CreateTransactionEntryDto = {
        name: 'Auto-ID Transaction',
        entries: [
          { account_id: '1', amount: 100, direction: 'debit' },
          { account_id: '2', amount: 100, direction: 'credit' },
        ],
      };
      const transaction = service.create(transactionData);
      expect(transaction.id).toBeDefined();
    });

    it('should throw BadRequestException for invalid entry direction', () => {
      const transactionData: CreateTransactionEntryDto = {
        name: 'Invalid Direction',
        entries: [
          { account_id: '1', amount: 100, direction: 'invalid' as any },
          { account_id: '2', amount: 100, direction: 'credit' },
        ],
      };
      expect(() => service.create(transactionData)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for negative entry amount', () => {
      const transactionData: CreateTransactionEntryDto = {
        name: 'Negative Amount',
        entries: [
          { account_id: '1', amount: -100, direction: 'debit' },
          { account_id: '2', amount: 100, direction: 'credit' },
        ],
      };
      expect(() => service.create(transactionData)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for zero entry amount', () => {
      const transactionData: CreateTransactionEntryDto = {
        name: 'Zero Amount',
        entries: [
          { account_id: '1', amount: 0, direction: 'debit' },
          { account_id: '2', amount: 0, direction: 'credit' },
        ],
      };
      expect(() => service.create(transactionData)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for duplicate entry account_ids', () => {
      const transactionData: CreateTransactionEntryDto = {
        name: 'Duplicate Account IDs',
        entries: [
          { account_id: '1', amount: 50, direction: 'debit' },
          { account_id: '1', amount: 50, direction: 'credit' },
        ],
      };
      expect(() => service.create(transactionData)).toThrow(
        BadRequestException,
      );
    });

    it('should allow transactions with more than two entries if balanced', () => {
      jest.spyOn(service, 'accountsExist').mockReturnValue(true);
      const transactionData: CreateTransactionEntryDto = {
        name: 'Multi-Entry',
        entries: [
          { account_id: '1', amount: 50, direction: 'debit' },
          { account_id: '2', amount: 30, direction: 'credit' },
          { account_id: '3', amount: 20, direction: 'credit' },
        ],
      };
      const transaction = service.create(transactionData);
      expect(transaction.entries.length).toBe(3);
    });

    it('should throw BadRequestException if any entry references a non-existent account', () => {
      const transactionData: CreateTransactionEntryDto = {
        name: 'Nonexistent Account',
        entries: [
          { account_id: 'does-not-exist', amount: 100, direction: 'debit' },
          { account_id: '2', amount: 100, direction: 'credit' },
        ],
      };
      expect(() => service.create(transactionData)).toThrow(
        BadRequestException,
      );
    });
  });
});
