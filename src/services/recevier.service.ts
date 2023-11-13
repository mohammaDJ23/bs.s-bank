import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Bill, Receiver, User } from '../entities';
import { ReceiverListFiltersDto } from 'src/dtos';

@Injectable()
export class ReceiverService {
  constructor(@InjectRepository(Receiver) private readonly receiverRepository: Repository<Receiver>) {}

  async createWithEntityManager(manager: EntityManager, payload: Bill, user: User): Promise<void> {
    const findedReceiver = await manager
      .createQueryBuilder(Receiver, 'receiver')
      .where('receiver.name = :receiver')
      .andWhere('receiver.user_id = :userId')
      .setParameters({ receiver: payload.receiver, userId: user.id })
      .getOne();
    if (!findedReceiver) {
      const newReceiver = manager.create(Receiver, { name: payload.receiver, user });
      await manager.createQueryBuilder().insert().orIgnore(true).into(Receiver).values(newReceiver).execute();
    }
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
}
