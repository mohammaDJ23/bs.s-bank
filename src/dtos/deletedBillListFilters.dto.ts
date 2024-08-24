import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BillListFiltersDto } from './billListFilters.dto';

export class DeletedBillListFiltersDto extends BillListFiltersDto {
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

  @Type(() => Number)
  @IsNumber()
  @ApiProperty()
  deletedDate: number = 0;
}
