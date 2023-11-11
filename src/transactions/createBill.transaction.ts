import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService, ReceiverService } from 'src/services';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { Bill, User } from 'src/entities';
import { CreateBillDto } from 'src/dtos';

@Injectable()
export class CreateBillTransaction extends BaseTransaction {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
    @Inject(forwardRef(() => ConsumerService))
    private readonly consumerService: ConsumerService,
    @Inject(forwardRef(() => ReceiverService))
    private readonly receiverService: ReceiverService,
  ) {
    super(dataSource);
  }

  protected async execute(manager: EntityManager, payload: CreateBillDto, user: User): Promise<Bill> {
    const createdBill = await this.billService.createWithEntityManager(manager, payload, user);
    await this.consumerService.createWithEntityManager(manager, createdBill, user);
    await this.receiverService.createWithEntityManager(manager, createdBill, user);
    return createdBill;
  }
}
