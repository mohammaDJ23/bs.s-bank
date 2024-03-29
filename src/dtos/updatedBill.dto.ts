import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatedBillDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  amount: string;

  @Expose()
  @ApiProperty()
  receiver: string;

  @Expose()
  @ApiProperty()
  location: string;

  @Expose()
  @ApiProperty()
  consumers: string[];

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
  userId: number;
}
