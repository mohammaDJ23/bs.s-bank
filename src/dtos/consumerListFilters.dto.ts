import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsumerListFiltersDto {
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  @IsOptional()
  q: string = '';
}
