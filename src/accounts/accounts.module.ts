import { Logger, Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.services';
import { TransactionsService } from '../transactions/transactions.services';

@Module({
  imports: [],
  controllers: [AccountsController],
  providers: [AccountsService, TransactionsService, Logger],
})
export class AccountsModule {}
