import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AccountsService } from './accounts.services';
import { Account } from '../types';
import { CreateAccountType } from './accounts.dto';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountService: AccountsService,
    private readonly logger: Logger,
  ) {}

  @Get('/:id')
  getAccount(@Param('id') id: string): Account {
    this.logger.log(`Getting account with id: ${id}`);
    return this.accountService.get(id);
  }

  @Get('/')
  getAllAccounts(): Account[] {
    this.logger.log('Getting all accounts');
    const allAccounts = this.accountService.all();

    this.logger.log(`Found ${allAccounts.length} accounts`);
    return allAccounts;
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @Post('/')
  createAccount(@Body() accountData: CreateAccountType): Account {
    this.logger.log('Creating account');
    const createdAccount = this.accountService.create(accountData);
    this.logger.log(`Account created with id: ${createdAccount.id}`);
    return createdAccount;
  }
}
