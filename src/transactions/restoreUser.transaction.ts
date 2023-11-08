import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService, UserService } from 'src/services';
import { RestoredUserObj, RestoredUserWithBillsObj } from 'src/types';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RestoreUserTransaction extends BaseTransaction<RestoredUserObj, RestoredUserWithBillsObj> {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
    @Inject(forwardRef(() => ConsumerService))
    private readonly consumerService: ConsumerService,
    @Inject(process.env.NOTIFICATION_RABBITMQ_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
  ) {
    super(dataSource);
  }

  protected async execute(data: RestoredUserObj, manager: EntityManager): Promise<RestoredUserWithBillsObj> {
    const restoredUser = await this.userService.restoreWithEntityManager(
      data.restoredUser.id,
      data.currentUser.id,
      manager,
    );
    const restoredBills = await this.billService.restoreManyWithEntityManager(data.restoredUser.id, manager);
    await this.consumerService.restoreWithEntityManager(data.restoredUser.id, manager);
    await this.notificationClientProxy
      .send('restored_user', { currentUser: data.currentUser, restoredUser: data.restoredUser })
      .toPromise();
    return { restoredUser, restoredBills };
  }
}
