import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService } from 'src/services';
import { CreateBillObj } from 'src/types';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { Bill } from 'src/entities';

@Injectable()
export class CreateBillTransaction extends BaseTransaction<CreateBillObj, Bill> {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
    @Inject(forwardRef(() => ConsumerService))
    private readonly consumerService: ConsumerService,
  ) {
    super(dataSource);
  }

  protected async execute(data: CreateBillObj, manager: EntityManager): Promise<Bill> {
    const createdBill = await this.billService.createWithEntityManager(data.payload, data.user, manager);
    await this.consumerService.createConsumerWithEntityManager(createdBill, data.user, manager);
    return createdBill;
  }
}
