import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';
import { ReceiverDto } from './receiver.dto';
import { ConsumerDto } from './consumer.dto';

export class DeletedBillDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  amount: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  date: Date;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @ApiProperty()
  deletedAt: Date;

  @Expose()
  @ApiProperty()
  @Type(() => LocationDto)
  location: LocationDto;

  @Expose()
  @ApiProperty()
  @Type(() => ReceiverDto)
  receiver: ReceiverDto;

  @Expose()
  @ApiProperty()
  @Type(() => ConsumerDto)
  consumers: ConsumerDto[];
}
