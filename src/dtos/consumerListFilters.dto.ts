import { IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsumerListFiltersDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z_]+( [a-zA-Z_]+)*$/, { message: 'Invalid consumer name.' })
  @ApiProperty()
  q: string;
}
