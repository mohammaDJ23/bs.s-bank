import { ArgumentMetadata } from '@nestjs/common';
import { Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

console.log('');

@Injectable()
export class ParseBillListFiltersPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype) {
      return value;
    }

    return plainToInstance(metatype, value);
  }
}
