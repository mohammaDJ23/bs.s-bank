import { ArgumentMetadata } from '@nestjs/common';
import { Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ParseLocationListFiltersPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype) {
      return value;
    }

    return plainToInstance(metatype, value);
  }
}
