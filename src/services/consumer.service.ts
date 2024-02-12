import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Brackets, EntityManager, Repository } from 'typeorm';
import { Bill, Consumer, User } from '../entities';
import { ConsumerListFiltersDto } from 'src/dtos';

@Injectable()
export class ConsumerService {
  constructor(@InjectRepository(Consumer) private readonly consumerRepository: Repository<Consumer>) {}

  async createWithEntityManager(manager: EntityManager, payload: Bill, user: User): Promise<void> {
    const findedConsumers = await manager
      .createQueryBuilder(Consumer, 'consumer')
      .where('consumer.name IN (:...consumers)')
      .andWhere('consumer.user_id = :userId')
      .setParameters({ consumers: payload.consumers, userId: user.id })
      .getMany();

    const consumers = payload.consumers;
    for (let i = 0; i < findedConsumers.length; i++) {
      const index = consumers.indexOf(findedConsumers[i].name);
      if (index > -1) {
        consumers.splice(index, 1);
      }
    }

    const newConsumers = consumers.map((consumer) => {
      return manager.create(Consumer, { name: consumer, user });
    });
    await manager.createQueryBuilder().insert().orIgnore(true).into(Consumer).values(newConsumers).execute();
  }

  findAll(
    page: number,
    take: number,
    filters: ConsumerListFiltersDto,
    user: User,
  ): Promise<[Consumer[], number]> {
    return this.consumerRepository
      .createQueryBuilder('consumer')
      .where('consumer.user_id = :userId')
      .andWhere(
        new Brackets((query) =>
          query
            .where('to_tsvector(consumer.name) @@ plainto_tsquery(:q)')
            .orWhere("consumer.name ILIKE '%' || :q || '%'"),
        ),
      )
      .orderBy('consumer.createdAt', 'DESC')
      .take(take)
      .skip((page - 1) * take)
      .setParameters({ userId: user.id, q: filters.q })
      .getManyAndCount();
  }

  async deleteManyWithEntityManager(manager: EntityManager, payload: User): Promise<void> {
    await manager
      .createQueryBuilder(Consumer, 'consumer')
      .softDelete()
      .where('consumer.user_id = :id')
      .setParameters({ id: payload.id })
      .execute();
  }

  async restoreManyWithEntityManager(manager: EntityManager, payload: User): Promise<void> {
    await manager
      .createQueryBuilder(Consumer, 'consumer')
      .restore()
      .where('consumer.user_id = :id')
      .setParameters({ id: payload.id })
      .execute();
  }
}
