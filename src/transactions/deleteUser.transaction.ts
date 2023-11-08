import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService, UserService } from 'src/services';
import { DeletedUserObj, DeletedUserWithBillsObj } from 'src/types';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class DeleteUserTransaction extends BaseTransaction<DeletedUserObj, DeletedUserWithBillsObj> {
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

  protected async execute(data: DeletedUserObj, manager: EntityManager): Promise<DeletedUserWithBillsObj> {
    const deletedUser = await this.userService.deleteWithEntityManager(
      data.deletedUser.id,
      data.currentUser.id,
      manager,
    );
    const deletedBills = await this.billService.deleteManyWithEntityManager(data.deletedUser.id, manager);
    await this.consumerService.deleteWithEntityManager(data.deletedUser.id, manager);
    await this.notificationClientProxy
      .send('deleted_user', { deletedUser: data.deletedUser, currentUser: data.currentUser })
      .toPromise();
    return { deletedUser, deletedBills };
  }
}
