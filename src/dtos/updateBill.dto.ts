import {
  IsString,
  IsNumber,
  IsNumberString,
  Length,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Validate,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsConsumers, IsDate, IsPositiveNumberString } from 'src/validators';

export class UpdateBillDto {
  @IsNumberString()
  @ApiProperty()
  id: string;

  @IsNumberString()
  @Length(1, 18)
  @Validate(IsPositiveNumberString, { message: 'Invalid amount.' })
  @ApiProperty()
  amount: string;

  @IsString()
  @Length(3, 100)
  @Matches(/^[a-zA-Z_]+( [a-zA-Z_]+)*$/, { message: 'Invalid receiver.' })
  @ApiProperty()
  receiver: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @Validate(IsConsumers, { message: 'Invalid consumers.' })
  @ApiProperty()
  consumers: string[];

  @IsString()
  @Length(3, 500)
  @Matches(/^[^\s]+(\s+[^\s]+)*$/, { message: 'Invalid description.' })
  @ApiProperty()
  description: string;

  @IsNumber()
  @Validate(IsDate, { message: 'Invalid date.' })
  @ApiProperty()
  date: number;
}
