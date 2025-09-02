import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionEntry } from '../types';

export class CreateTransactionEntryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsArray()
  entries: TransactionEntry[];
}

export class AddTransactionEntryDto {
  @IsString()
  account_id: string;

  @IsNumber()
  amount: number;

  @IsEnum(['credit', 'debit'])
  direction: 'credit' | 'debit';
}
