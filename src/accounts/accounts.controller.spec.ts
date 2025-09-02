import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.services';
import { Logger } from '@nestjs/common';
import { Direction } from '../types';
import { TransactionsService } from '../transactions/transactions.services';

describe('AccountsController', () => {
  let controller: AccountsController;

  let transactionsServiceMock: any;

  beforeEach(async () => {
    transactionsServiceMock = {
      validateTransactionEntries: jest.fn().mockReturnValue(true),
      create: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      addTransactionEntry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        AccountsService,
        Logger,
        {
          provide: TransactionsService,
          useValue: transactionsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAccount', () => {
    it('should return an account', () => {
      const account = controller.getAccount('1');
      expect(account).toBeDefined();
    });
  });

  describe('getAllAccounts', () => {
    it('should return all accounts', () => {
      const accounts = controller.getAllAccounts();
      expect(accounts).toBeDefined();
    });
  });

  describe('createAccount', () => {
    it('should create an account', () => {
      const account = controller.createAccount({
        name: 'New Account',
        balance: 500,
        direction: Direction.DEBIT,
      });

      expect(account).toHaveProperty('id');
      expect(account.name).toBe('New Account');
      expect(account.balance).toBe(500);
      expect(account.direction).toBe(Direction.DEBIT);
    });
  });
});
