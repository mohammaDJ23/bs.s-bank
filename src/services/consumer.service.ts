import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityManager, Repository } from 'typeorm';
import { Bill, Consumer, User } from '../entities';

@Injectable()
export class ConsumerService {
  constructor(@InjectRepository(Consumer) private readonly ConsumerRepository: Repository<Consumer>) {}

  async createConsumerWithEntityManager(bill: Bill, manager: EntityManager): Promise<void> {
    const consumers = bill.consumers.map((consumer) => {
      return manager.create(Consumer, { name: consumer, user: bill.user });
    });
    await manager.createQueryBuilder().insert().orIgnore(true).into(Consumer).values(consumers).execute();
  }
}
