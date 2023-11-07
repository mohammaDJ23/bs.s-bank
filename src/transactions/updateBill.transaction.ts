import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService } from 'src/services';
import { UpdateBillObj } from 'src/types';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { Bill } from 'src/entities';

@Injectable()
export class UpdateBillTransaction extends BaseTransaction<UpdateBillObj, Bill> {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
    @Inject(forwardRef(() => ConsumerService))
    private readonly consumerService: ConsumerService,
  ) {
    super(dataSource);
  }

  protected async execute(data: UpdateBillObj, manager: EntityManager): Promise<Bill> {
    const updatedBill = await this.billService.updateWithEntityManager(data.payload, data.user, manager);
    await this.consumerService.createConsumerWithEntityManager(updatedBill, data.user, manager);
    return updatedBill;
  }
}
