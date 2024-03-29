import {
  IsString,
  IsNumberString,
  Length,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Validate,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsConsumers, IsDate, IsPositiveNumberString } from 'src/validators';

export class CreateBillDto {
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

  @ValidateIf((object, value) => !('date' in object) || value === undefined || object.date !== null)
  @Validate(IsDate, { message: 'Invalid date.' })
  @IsNumber()
  @ApiProperty()
  date: number | null;

  @IsString()
  @Length(3, 100)
  @Matches(/^[a-zA-Z_]+( [a-zA-Z_]+)*$/, { message: 'Invalid location.' })
  @ApiProperty()
  location: string;
}
