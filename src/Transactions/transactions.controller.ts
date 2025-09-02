import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.services';
import { Transaction } from '../types';
import { ApiBody } from '@nestjs/swagger';
import { AccountsService } from '../accounts/accounts.services';
import { Account } from '../types';
import { CreateTransactionEntryDto } from './transctions.dto';

@Controller('')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
    private readonly logger: Logger,
  ) {}

  @Get('transactions/:id')
  getTransactionById(@Param('id') id: string): Transaction {
    this.logger.log(`Getting transaction with id: ${id}`);
    return this.transactionsService.get(id);
  }

  @Get('transactions')
  getAllTransactions(): Transaction[] {
    this.logger.log('Getting all transactions');
    return this.transactionsService.all();
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @Post('transactions')
  @ApiBody({
    type: CreateTransactionEntryDto,
    examples: {
      example1: {
        summary: 'Create Transaction Example',
        value: {
          name: 'Sample Transaction',
          amount: 300,
          entries: [
            {
              account_id: '1',
              amount: 200,
              direction: 'credit',
            },
            {
              account_id: '2',
              amount: 100,
              direction: 'debit',
            },
          ],
        },
      },
    },
  })
  createTransaction(
    @Body() transactionData: CreateTransactionEntryDto,
  ): Account[] {
    this.logger.log('Creating transaction');
    const transaction = this.transactionsService.create(transactionData);

    this.logger.log('Processing transaction');
    const result = this.accountsService.processTransaction(transaction);
    this.logger.log('Transaction processed');
    return result;
  }
}
