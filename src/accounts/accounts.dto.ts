import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Direction } from '../types';

export class CreateAccountType {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  balance: number;

  @IsNotEmpty()
  @IsEnum(Direction)
  direction: Direction;
}

export class UpdateAccountType {
  @IsOptional()
  @IsString()
  name?: string;
}
