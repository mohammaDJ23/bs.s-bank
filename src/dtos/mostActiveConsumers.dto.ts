import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ConsumerDto } from './consumer.dto';

export class MostActiveConsumersDto {
  @Expose()
  @ApiProperty()
  quantities: number;

  @Expose()
  @ApiProperty()
  @Type(() => ConsumerDto)
  consumer: ConsumerDto;
}
