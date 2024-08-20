import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Brackets, EntityManager, Repository } from 'typeorm';
import { Consumer, User } from '../entities';
import {
  ConsumerListFiltersDto,
  CreateBillDto,
  MostActiveConsumersDto,
  UpdateBillDto,
  UpdateConsumerDto,
} from 'src/dtos';

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

  async findById(id: number, user: User): Promise<Consumer> {
    return this.consumerRepository
      .createQueryBuilder('consumer')
      .where('consumer.user_id = :userId')
      .andWhere('consumer.id = :consumerId')
      .setParameters({ consumerId: id, userId: user.id })
      .getOneOrFail();
  }

  async delete(id: number, user: User): Promise<Consumer> {
    return this.consumerRepository
      .createQueryBuilder('consumer')
      .softDelete()
      .where('consumer.user_id = :userId')
      .andWhere('consumer.id = :consumerId')
      .setParameters({ userId: user.id, consumerId: id })
      .returning('*')
      .exe({ noEffectError: 'Could not delete the consumer.' });
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

  mostActive(user: User, take: number): Promise<MostActiveConsumersDto[]> {
    return this.consumerRepository.query(
      `
        SELECT COUNT(c.id) as quantities, 
          json_build_object(
            'id', c.id, 
            'name', c.name,
            'createdAt', c.created_at,
            'updatedAt', c.updated_at,
            'deletedAt', c.deleted_at
          ) AS consumer FROM public.consumer AS c 

        LEFT JOIN (
          SELECT bc.consumer_id, b.bill_deleted_at FROM public.bill_consumer AS bc

          LEFT JOIN (
            SELECT b.deleted_at AS bill_deleted_at, id FROM public.bill AS b
            WHERE b.user_id = $1
          ) b ON b.id = bc.bill_id
        ) bc ON bc.consumer_id = c.id
        
        WHERE c.deleted_at IS NULL AND 
          c.user_id = $1 AND 
          bc.bill_deleted_at IS NULL AND
          bc.consumer_id IS NOT NULL
          
        GROUP BY c.id

        ORDER BY quantities DESC
        
        LIMIT $2;
      `,
      [user.id, take],
    );
  }
}
