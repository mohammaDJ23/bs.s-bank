import { ExecutionContext } from '@nestjs/common';
import { getCurrentUser } from './currentUser';
import { getRpcData } from './request';
import { UserObj } from 'src/types';

export function getCacheKey(context: ExecutionContext): string {
  const user = getCurrentUser(context);
  const id = user.id;
  return `${id}.${process.env.PORT}`;
}

export function getCacheKeyForMicroservice(context: ExecutionContext): string {
  const rpcData = getRpcData<UserObj>(context);
  const id = rpcData.user.id;
  return `${id}.${process.env.PORT}`;
}
