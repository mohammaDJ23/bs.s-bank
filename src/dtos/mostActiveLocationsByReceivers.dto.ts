import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';
import { ReceiverDto } from './receiver.dto';

export class MostActiveLocationsByReceiversDto {
  @Expose()
  @ApiProperty()
  @Type(() => LocationDto)
  location: LocationDto;

  @Expose()
  @ApiProperty()
  @Type(() => ReceiverDto)
  receivers: ReceiverDto[];
}
