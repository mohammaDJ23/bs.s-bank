import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';

export class MostActiveLocationsDto {
  @Expose()
  @ApiProperty()
  quantities: number;

  @Expose()
  @ApiProperty()
  @Type(() => LocationDto)
  location: LocationDto;
}
