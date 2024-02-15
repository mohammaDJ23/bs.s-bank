import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocationListFiltersDto {
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  q: string;
}
