import { Request as Req } from 'express';
import { CreateBillDto, UpdateBillDto } from 'src/dtos';
import { Bill, User } from 'src/entities';

export interface CurrentUserObj {
  currentUser: User;
}

export interface UserObj {
  user: User;
}

export interface Request extends Req, CurrentUserObj {}

export type Exception =
  | {
      message: string;
      statusCode: number;
      error: string;
    }
  | string;

export interface ClassConstructor {
  new (...args: any[]): {};
}

export interface DtoConstructor {
  readonly construct: ClassConstructor;
}

export class SerialConstructor implements DtoConstructor {
  constructor(readonly construct: ClassConstructor) {}
}

export class ListSerial extends SerialConstructor {}

export class ArraySerial extends SerialConstructor {}

export class ObjectSerial extends SerialConstructor {}

export interface EncryptedUserObj {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  expiration: number;
}

export enum UserRoles {
  OWNER = 'owner',
  ADMIN = 'admin',
  USER = 'user',
}

export type ListObj = [any[], number];

export enum CacheKeys {
  USER = 'USER',
  BILLS = 'BILLS',
  BILL = 'BILL',
  QUANTITIES = 'QUANTITIES',
  TOTAL_AMOUNT = 'TOTAL_AMOUNT',
  DELETED_BILLS = 'DELETED_BILLS',
  DELETED_BILL = 'DELETED_BILL',
}

export enum CacheKeyTypes {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface CacheKeyRoles {
  name: CacheKeys;
  type: CacheKeyTypes;
}

export interface CreatedUserObj extends UserObj {
  payload: User;
}

export interface UpdatedUserObj extends UserObj {
  payload: User;
}

export interface DeletedUserObj extends UserObj {
  payload: User;
}

export interface RestoredUserObj extends UserObj {
  payload: User;
}

export interface RestoredBillsObj {
  restoredBills: Bill[];
}

export interface DeletedBillsObj {
  deletedBills: Bill[];
}

export interface CreateBillObj {
  payload: CreateBillDto;
  user: User;
}

export interface UpdateBillObj {
  payload: UpdateBillDto;
  user: User;
}
