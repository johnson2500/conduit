import { forwardRef, Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.services';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [forwardRef(() => TransactionsModule)],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
