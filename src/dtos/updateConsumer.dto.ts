import { IsString, IsNumber, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConsumerDto {
  @IsNumber()
  @ApiProperty()
  id: number;

  @IsString()
  @Length(3, 100)
  @Matches(/^[a-zA-Z_]+( [a-zA-Z_]+)*$/, { message: 'Invalid name.' })
  @ApiProperty()
  name: string;
}
