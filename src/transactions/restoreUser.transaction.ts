import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService, LocationService, ReceiverService, UserService } from 'src/services';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'src/entities';

@Injectable()
export class RestoreUserTransaction extends BaseTransaction {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
    @Inject(forwardRef(() => ConsumerService))
    private readonly consumerService: ConsumerService,
    @Inject(forwardRef(() => ReceiverService))
    private readonly receiverService: ReceiverService,
    @Inject(forwardRef(() => LocationService))
    private readonly locationService: LocationService,
    @Inject(process.env.NOTIFICATION_RABBITMQ_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
  ) {
    super(dataSource);
  }

  protected async execute(manager: EntityManager, payload: User, user: User): Promise<User> {
    const restoredUser = await this.userService.restoreWithEntityManager(manager, payload, user);
    await this.billService.restoreManyWithEntityManager(manager, payload);
    await this.consumerService.restoreManyWithEntityManager(manager, payload);
    await this.receiverService.restoreManyWithEntityManager(manager, payload);
    await this.locationService.restoreManyWithEntityManager(manager, payload);
    await this.notificationClientProxy.send('restored_user', { payload, user }).toPromise();
    return restoredUser;
  }
}
