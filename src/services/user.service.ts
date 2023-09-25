import { ConflictException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWithBillInfoDto } from 'src/dtos';
import {
  CreatedUserObj,
  DeletedUserObj,
  RestoredUserWithBillsObj,
  RestoredUserObj,
  UpdatedUserObj,
  DeletedUserWithBillsObj,
} from 'src/types';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../entities';
import { RabbitmqService } from './rabbitmq.service';
import { DeleteUserTransaction, RestoreUserTransaction } from 'src/transactions';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly rabbitmqService: RabbitmqService,
    @Inject(forwardRef(() => RestoreUserTransaction))
    private readonly restoreUserTransaction: RestoreUserTransaction,
    @Inject(forwardRef(() => DeleteUserTransaction))
    private readonly deleteUserTransaction: DeleteUserTransaction,
  ) {}

  findById(id: number): Promise<User> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.user_service_id = :id', { id })
      .getOneOrFail();
  }

  async create(payload: CreatedUserObj, context: RmqContext): Promise<User> {
    try {
      let findedUser = await this.userRepository
        .createQueryBuilder('public.user')
        .withDeleted()
        .where('public.user.email = :email', { email: payload.createdUser.email })
        .getOne();

      if (findedUser) throw new ConflictException('The user already exist.');

      payload.createdUser = Object.assign<User, Partial<User>>(payload.createdUser, {
        userServiceId: payload.createdUser.id,
      });
      const createdUser = await this.userRepository
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(payload.createdUser)
        .returning('*')
        .exe({ noEffectError: 'Could not create the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return createdUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async update(payload: UpdatedUserObj, context: RmqContext): Promise<User> {
    try {
      const updatedUser = await this.userRepository
        .createQueryBuilder('public.user')
        .update()
        .set({
          email: payload.updatedUser.email,
          firstName: payload.updatedUser.firstName,
          lastName: payload.updatedUser.lastName,
          password: payload.updatedUser.password,
          phone: payload.updatedUser.phone,
          role: payload.updatedUser.role,
          updatedAt: new Date(payload.updatedUser.updatedAt),
        })
        .where('public.user.user_service_id = :userId')
        .andWhere('public.user.created_by = :currentUserId')
        .setParameters({ userId: payload.updatedUser.id, currentUserId: payload.currentUser.id })
        .returning('*')
        .exe({ noEffectError: 'Could not update the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return updatedUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async deleteWithEntityManager(
    deletedUserId: number,
    currentUserId: number,
    entityManager: EntityManager,
  ): Promise<User> {
    return entityManager
      .createQueryBuilder(User, 'public.user')
      .softDelete()
      .where('public.user.user_service_id = :deletedUserId')
      .andWhere('public.user.deleted_at IS NULL')
      .andWhere('public.user.created_by = :currentUserId')
      .setParameters({ deletedUserId, currentUserId })
      .returning('*')
      .exe({ noEffectError: 'Could not delete the user.' });
  }

  async delete(payload: DeletedUserObj, context: RmqContext): Promise<DeletedUserWithBillsObj> {
    try {
      const result = await this.deleteUserTransaction.run(payload);
      this.rabbitmqService.applyAcknowledgment(context);
      return result;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findByIdWithBillSummary(id: number): Promise<UserWithBillInfoDto> {
    const [response]: UserWithBillInfoDto[] = await this.userRepository.query(
      `
        SELECT
          user1.user_service_id AS id,
          user1.first_name AS "firstName",
          user1.last_name AS "lastName",
          user1.email AS email,
          user1.phone AS phone,
          user1.role AS role,
          user1.created_by AS "createdBy",
          user1.created_at AS "createdAt",
          user1.updated_at AS "updatedAt",
          user1.deleted_at AS "deletedAt",
          json_build_object('counts', COALESCE(bill.counts, 0)::TEXT, 'amounts', COALESCE(bill.amounts, 0)::TEXT) AS bill,
          json_build_object(
            'id', user2.user_service_id,
            'firstName', user2.first_name,
            'lastName', user2.last_name,
            'email', user2.email,
            'phone', user2.phone,
            'role', user2.role,
            'createdBy', user2.created_by,
            'createdAt', user2.created_at,
            'updatedAt', user2.updated_at,
            'deletedAt', user2.deleted_at
          ) AS parent,
          json_build_object(
            'quantities', COALESCE(user3.created_users, 0)::TEXT
          ) AS users
        FROM public.user AS user1
        LEFT JOIN (
          SELECT bill.user_id, COUNT(bill.user_id) AS counts, SUM(bill.amount::BIGINT) AS amounts
          FROM bill
          WHERE bill.deleted_at IS NULL
          GROUP BY bill.user_id
        ) bill ON bill.user_id = $1
        LEFT JOIN public.user AS user2 ON user2.user_service_id = user1.created_by
        LEFT JOIN (
          SELECT user3.created_by, COUNT(user3.id) AS created_users
          FROM public.user AS user3
          WHERE user3.deleted_at IS NULL AND user3.user_service_id != $1
          GROUP BY user3.created_by
        ) user3 ON user3.created_by = $1
        WHERE user1.user_service_id = $1 AND user1.deleted_at IS NULL;
      `,
      [id],
    );

    if (!response) throw new NotFoundException('Could not found the user.');
    return response;
  }

  async restoreWithEntityManager(
    restoredUserId: number,
    currentUserId: number,
    entityManager: EntityManager,
  ): Promise<User> {
    return entityManager
      .createQueryBuilder(User, 'public.user')
      .restore()
      .where('public.user.user_service_id = :restoredUserId')
      .andWhere('public.user.deleted_at IS NOT NULL')
      .andWhere('public.user.created_by = :currentUserId')
      .setParameters({ restoredUserId, currentUserId })
      .returning('*')
      .exe({ noEffectError: 'Could not restore the user.' });
  }

  async restore(payload: RestoredUserObj, context: RmqContext): Promise<RestoredUserWithBillsObj> {
    try {
      const result = await this.restoreUserTransaction.run(payload);
      this.rabbitmqService.applyAcknowledgment(context);
      return result;
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
