import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExeOptions } from 'src';
import {
  DeleteQueryBuilder,
  UpdateQueryBuilder,
  InsertQueryBuilder,
  SelectQueryBuilder,
  QueryBuilder,
} from 'typeorm';
import { SoftDeleteQueryBuilder } from 'typeorm/query-builder/SoftDeleteQueryBuilder';
import { camelcaseKeys } from './camelcase';

async function exe<Entity>(this: QueryBuilder<Entity>, options: ExeOptions = {}) {
  options.camelcase = options.camelcase ?? true;
  options.resultType = options.resultType ?? 'object';

  const updatedResult = await this.execute();

  if (updatedResult.affected <= 0 && options.noEffectError) {
    throw new BadRequestException(options.noEffectError);
  }

  let raw = updatedResult.raw || [];

  if (options.camelcase) {
    raw = raw.map((item: any) => {
      if (typeof item === 'object') {
        return camelcaseKeys(item);
      }
      return item;
    });
  }

  if (options.resultType === 'array') {
    return raw;
  }

  return raw[0];
}

SelectQueryBuilder.prototype.getOneOrFail = async function <Entity>(this: SelectQueryBuilder<Entity>) {
  const entity = await this.getOne();
  if (!entity) {
    throw new NotFoundException('Could not be found the entity');
  }
  return entity;
};

InsertQueryBuilder.prototype.exe = exe;

UpdateQueryBuilder.prototype.exe = exe;

DeleteQueryBuilder.prototype.exe = exe;

SoftDeleteQueryBuilder.prototype.exe = exe;
