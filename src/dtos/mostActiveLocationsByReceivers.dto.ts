import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';
import { MostActiveReceiversDto } from './mostActiveReceivers.dto';

export class MostActiveLocationsByReceiversDto {
  @Expose()
  @ApiProperty()
  @Type(() => LocationDto)
  location: LocationDto;

  @Expose()
  @ApiProperty()
  @Type(() => MostActiveReceiversDto)
  receivers: MostActiveReceiversDto[];
}
