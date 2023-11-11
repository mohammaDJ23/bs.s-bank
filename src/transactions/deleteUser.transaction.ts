import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, ConsumerService, UserService } from 'src/services';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'src/entities';

@Injectable()
export class DeleteUserTransaction extends BaseTransaction {
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

  protected async execute(manager: EntityManager, payload: User, user: User): Promise<User> {
    const deletedUser = await this.userService.deleteWithEntityManager(manager, payload, user);
    await this.billService.deleteManyWithEntityManager(manager, payload);
    await this.consumerService.deleteManyWithEntityManager(manager, payload);
    await this.notificationClientProxy.send('deleted_user', { payload, user }).toPromise();
    return deletedUser;
  }
}
