import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService, LocationService, ReceiverService } from 'src/services';
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
    @Inject(forwardRef(() => LocationService))
    private readonly locationService: LocationService,
  ) {
    super(dataSource);
  }

  protected async execute(manager: EntityManager, payload: CreateBillDto, user: User): Promise<Bill> {
    const consumers = await this.consumerService.createWithEntityManager(manager, payload, user);
    const receiver = await this.receiverService.createWithEntityManager(manager, payload, user);
    const location = await this.locationService.createWithEntityManager(manager, payload, user);

    const createdBill = await this.billService.createWithEntityManager(
      manager,
      payload,
      location,
      receiver,
      consumers,
      user,
    );

    return createdBill;
  }
}
