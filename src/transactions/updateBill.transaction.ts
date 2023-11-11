import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService, ReceiverService } from 'src/services';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { Bill, User } from 'src/entities';
import { UpdateBillDto } from 'src/dtos';

@Injectable()
export class UpdateBillTransaction extends BaseTransaction {
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

  protected async execute(manager: EntityManager, payload: UpdateBillDto, user: User): Promise<Bill> {
    const updatedBill = await this.billService.updateWithEntityManager(manager, payload, user);
    await this.consumerService.createWithEntityManager(manager, updatedBill, user);
    await this.receiverService.createWithEntityManager(manager, updatedBill, user);
    return updatedBill;
  }
}
