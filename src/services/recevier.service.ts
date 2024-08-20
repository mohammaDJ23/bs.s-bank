import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Receiver, User } from '../entities';
import {
  CreateBillDto,
  MostActiveReceiversDto,
  ReceiverListFiltersDto,
  UpdateBillDto,
  UpdateReceiverDto,
} from 'src/dtos';

@Injectable()
export class ReceiverService {
  constructor(@InjectRepository(Receiver) private readonly receiverRepository: Repository<Receiver>) {}

  async createWithEntityManager(
    manager: EntityManager,
    payload: CreateBillDto | UpdateBillDto,
    user: User,
  ): Promise<Receiver> {
    const findedReceiver = await manager
      .createQueryBuilder(Receiver, 'receiver')
      .withDeleted()
      .where('receiver.name = :receiver')
      .andWhere('receiver.user_id = :userId')
      .setParameters({ receiver: payload.receiver, userId: user.id })
      .getOne();
    if (!findedReceiver) {
      return manager
        .createQueryBuilder()
        .insert()
        .into(Receiver)
        .values(manager.create(Receiver, { name: payload.receiver, user }))
        .returning('*')
        .exe({ noEffectError: 'Cound not create receiver.' });
    }
    return findedReceiver;
  }

  findAll(
    page: number,
    take: number,
    filters: ReceiverListFiltersDto,
    user: User,
  ): Promise<[Receiver[], number]> {
    return this.receiverRepository
      .createQueryBuilder('receiver')
      .where('receiver.user_id = :userId')
      .andWhere(
        new Brackets((query) =>
          query
            .where('to_tsvector(receiver.name) @@ plainto_tsquery(:q)')
            .orWhere("receiver.name ILIKE '%' || :q || '%'"),
        ),
      )
      .orderBy('receiver.createdAt', 'DESC')
      .take(take)
      .skip((page - 1) * take)
      .setParameters({ userId: user.id, q: filters.q })
      .getManyAndCount();
  }

  async findById(id: number, user: User): Promise<Receiver> {
    return this.receiverRepository
      .createQueryBuilder('receiver')
      .where('receiver.user_id = :userId')
      .andWhere('receiver.id = :receiverId')
      .setParameters({ receiverId: id, userId: user.id })
      .getOneOrFail();
  }

  async delete(id: number, user: User): Promise<Receiver> {
    return this.receiverRepository
      .createQueryBuilder('receiver')
      .softDelete()
      .where('receiver.user_id = :userId')
      .andWhere('receiver.id = :receiverId')
      .setParameters({ userId: user.id, receiverId: id })
      .returning('*')
      .exe({ noEffectError: 'Could not delete the receiver.' });
  }

  async update(payload: UpdateReceiverDto, user: User): Promise<Receiver> {
    const findedReceiver = await this.receiverRepository
      .createQueryBuilder('receiver')
      .withDeleted()
      .where('receiver.user_id = :userId')
      .andWhere('receiver.name = :receiverName')
      .andWhere('receiver.id != :receiverId')
      .setParameters({ userId: user.id, receiverName: payload.name, receiverId: payload.id })
      .getOne();

    if (findedReceiver) throw new BadRequestException('A receiver with this name exist.');

    return this.receiverRepository
      .createQueryBuilder('receiver')
      .update(Receiver)
      .set(payload)
      .where('receiver.user_id = :userId')
      .andWhere('receiver.id = :receiverId')
      .setParameters({ userId: user.id, receiverId: payload.id })
      .returning('*')
      .exe({ noEffectError: 'Could not update the receiver.' });
  }

  async deleteManyWithEntityManager(manager: EntityManager, payload: User): Promise<void> {
    await manager
      .createQueryBuilder(Receiver, 'receiver')
      .softDelete()
      .where('receiver.user_id = :id')
      .setParameters({ id: payload.id })
      .execute();
  }

  async restoreManyWithEntityManager(manager: EntityManager, payload: User): Promise<void> {
    await manager
      .createQueryBuilder(Receiver, 'receiver')
      .restore()
      .where('receiver.user_id = :id')
      .setParameters({ id: payload.id })
      .execute();
  }

  mostActive(user: User, take: number): Promise<MostActiveReceiversDto[]> {
    return this.receiverRepository.query(
      `
        SELECT COUNT(r.id) AS quantities,
          json_build_object(
            'id', r.id, 
            'name', r.name,
            'createdAt', r.created_at,
            'updatedAt', r.updated_at,
            'deletedAt', r.deleted_at
          ) AS receiver FROM public.receiver AS r

        LEFT JOIN (
          SELECT b.receiver_id, b.deleted_at, id FROM public.bill AS b
          WHERE b.user_id = $1
        ) b ON b.receiver_id = r.id

        WHERE r.deleted_at IS NULL AND
          r.user_id = $1 AND
          b.deleted_at IS NULL AND
          b.id IS NOT NULL

        GROUP BY r.id

        ORDER BY quantities DESC

        LIMIT $2;
      `,
      [user.id, take],
    );
  }
}
