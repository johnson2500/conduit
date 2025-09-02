import { Logger, Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.services';
import { AccountsService } from '../accounts/accounts.services';

@Module({
  imports: [],
  controllers: [TransactionsController],
  providers: [TransactionsService, AccountsService, Logger],
})
export class TransactionsModule {}
