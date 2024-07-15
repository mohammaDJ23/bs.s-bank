import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Brackets, EntityManager, Repository } from 'typeorm';
import { Consumer, User } from '../entities';
import { ConsumerListFiltersDto, CreateBillDto, UpdateBillDto, UpdateConsumerDto } from 'src/dtos';

@Injectable()
export class ConsumerService {
  constructor(@InjectRepository(Consumer) private readonly consumerRepository: Repository<Consumer>) {}

  async createWithEntityManager(
    manager: EntityManager,
    payload: CreateBillDto | UpdateBillDto,
    user: User,
  ): Promise<Consumer[]> {
    const findedConsumers = await manager
      .createQueryBuilder(Consumer, 'consumer')
      .withDeleted()
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

    if (consumers.length <= 0) {
      return findedConsumers;
    }

    const createdConsumers = await manager
      .createQueryBuilder()
      .insert()
      .into(Consumer)
      .values(consumers.map((consumer) => manager.create(Consumer, { name: consumer, user })))
      .returning('*')
      .exe({ resultType: 'array', noEffectError: 'Could not create the consumers.' });

    return findedConsumers.concat(createdConsumers);
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

  async update(payload: UpdateConsumerDto, user: User): Promise<Consumer> {
    const findedConsumer = await this.consumerRepository
      .createQueryBuilder('consumer')
      .withDeleted()
      .where('consumer.user_id = :userId')
      .andWhere('consumer.name = :consumerName')
      .andWhere('consumer.id != :consumerId')
      .setParameters({ userId: user.id, consumerName: payload.name, consumerId: payload.id })
      .getOne();

    if (findedConsumer) throw new BadRequestException('A consumer with this name exist.');

    return this.consumerRepository
      .createQueryBuilder('consumer')
      .update(Consumer)
      .set(payload)
      .where('consumer.user_id = :userId')
      .andWhere('consumer.id = :consumerId')
      .setParameters({ userId: user.id, consumerId: payload.id })
      .returning('*')
      .exe({ noEffectError: 'Could not update the consumer.' });
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
