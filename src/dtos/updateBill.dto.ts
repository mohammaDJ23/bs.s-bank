import {
  IsString,
  IsNumber,
  IsNumberString,
  Length,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Validate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsConsumers } from 'src/validators';

export class UpdateBillDto {
  @IsNumberString()
  @ApiProperty()
  id: string;

  @IsNumberString()
  @Length(1, 18)
  @ApiProperty()
  amount: string;

  @IsString()
  @Length(3, 100)
  @ApiProperty()
  receiver: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @Validate(IsConsumers, { message: 'Each consumer has to have less than 100 length.' })
  @ApiProperty()
  consumers: string[];

  @IsString()
  @Length(3, 500)
  @ApiProperty()
  description: string;

  @IsNumber()
  @ApiProperty()
  date: number;
}
