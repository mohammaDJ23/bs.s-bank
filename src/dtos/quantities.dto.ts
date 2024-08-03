import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuantitiesDto {
  @Expose()
  @ApiProperty()
  amount: string;

  @Expose()
  @ApiProperty()
  quantities: string;
}
