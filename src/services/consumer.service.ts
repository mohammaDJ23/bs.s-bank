import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Brackets, EntityManager, Repository } from 'typeorm';
import { Bill, Consumer, User } from '../entities';
import { ConsumerListFiltersDto } from 'src/dtos';

@Injectable()
export class ConsumerService {
  constructor(@InjectRepository(Consumer) private readonly ConsumerRepository: Repository<Consumer>) {}

  async createConsumerWithEntityManager(bill: Bill, user: User, manager: EntityManager): Promise<void> {
    const findedConsumer = await manager
      .createQueryBuilder(Consumer, 'consumer')
      .where('consumer.name IN (:...consumers)')
      .andWhere('consumer.user_id = :userId')
      .setParameters({ consumers: bill.consumers, userId: user.id })
      .getMany();

    const consumers = bill.consumers;
    for (let i = 0; i < findedConsumer.length; i++) {
      const index = consumers.indexOf(findedConsumer[i].name);
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
    return this.ConsumerRepository.createQueryBuilder('consumer')
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
}
