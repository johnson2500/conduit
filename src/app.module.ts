import { Module } from '@nestjs/common';
import { TransactionsModule } from './transactions/transactions.module';
import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [AccountsModule, TransactionsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
