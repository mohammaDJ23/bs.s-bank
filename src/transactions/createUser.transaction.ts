import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { UserService } from 'src/services';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'src/entities';

@Injectable()
export class CreateUserTransaction extends BaseTransaction {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(process.env.NOTIFICATION_RABBITMQ_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
  ) {
    super(dataSource);
  }

  protected async execute(manager: EntityManager, payload: User, user: User): Promise<User> {
    const createdUser = await this.userService.createWithEntityManager(manager, payload, user);
    await this.notificationClientProxy.send('created_user', { payload, user }).toPromise();
    return createdUser;
  }
}
