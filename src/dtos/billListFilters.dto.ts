import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BillListFiltersDto {
  @IsString()
  @ApiProperty()
  q: string = '';

  @Type(() => Number)
  @IsNumber()
  @ApiProperty()
  fromDate: number = 0;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty()
  toDate: number = 0;
}
