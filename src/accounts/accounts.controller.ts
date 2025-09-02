import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.services';
import { Account } from '../types';
import { CreateAccountType } from './accounts.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountsService) {}

  @Get('/:id')
  getAccount(@Param('id') id: string): Account {
    console.log(`Getting account with id: ${id}`);
    return this.accountService.get(id);
  }

  @Get('/')
  getAllAccounts(): Account[] {
    console.log('Getting all accounts');
    const allAccounts = this.accountService.all();

    console.log(`Found ${allAccounts.length} accounts`);
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
    console.log('Creating account');
    const createdAccount = this.accountService.create(accountData);
    console.log(`Account created with id: ${createdAccount.id}`);
    return createdAccount;
  }
}
