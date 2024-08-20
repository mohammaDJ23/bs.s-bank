import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReceiverDto } from './receiver.dto';

export class MostActiveReceiversDto {
  @Expose()
  @ApiProperty()
  quantities: number;

  @Expose()
  @ApiProperty()
  @Type(() => ReceiverDto)
  receiver: ReceiverDto;
}
