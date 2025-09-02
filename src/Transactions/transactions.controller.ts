import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.services';
import { Transaction } from '../types';
import { ApiBody } from '@nestjs/swagger';
import { AccountsService } from '../accounts/accounts.services';
import { CreateTransactionEntryDto } from './transctions.dto';

@Controller('')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
  ) {}

  @Get('transactions/:id')
  getTransactionById(@Param('id') id: string): Transaction {
    console.log(`Getting transaction with id: ${id}`);
    return this.transactionsService.get(id);
  }

  @Get('transactions')
  getAllTransactions(): Transaction[] {
    console.log('Getting all transactions');
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
  ): Transaction {
    console.log('Creating transaction');
    const transaction = this.transactionsService.create(transactionData);

    console.log('Transaction processed');
    return transaction;
  }
}
