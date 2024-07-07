import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService, LocationService, ReceiverService } from 'src/services';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { Bill, Consumer, User } from 'src/entities';
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
    @Inject(forwardRef(() => LocationService))
    private readonly locationService: LocationService,
  ) {
    super(dataSource);
  }

  protected async execute(manager: EntityManager, payload: UpdateBillDto, user: User): Promise<Bill> {
    const consumers = await this.consumerService.createWithEntityManager(manager, payload, user);
    const receiver = await this.receiverService.createWithEntityManager(manager, payload, user);
    const location = await this.locationService.createWithEntityManager(manager, payload, user);

    let deletedConsumer: Consumer | null = null;
    if ((deletedConsumer = consumers.find((consumer) => !!consumer.deletedAt)) && deletedConsumer)
      throw new BadRequestException(
        `Consumer "${deletedConsumer.name}" was deleted try to restore it then update the bill.`,
      );

    const updatedBill = await this.billService.updateWithEntityManager(
      manager,
      payload,
      location,
      receiver,
      consumers,
      user,
    );

    return updatedBill;
  }
}
