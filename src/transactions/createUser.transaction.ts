import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { UserService } from 'src/services';
import { CreatedUserObj } from 'src/types';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'src/entities';

@Injectable()
export class CreateUserTransaction extends BaseTransaction<CreatedUserObj, User> {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(process.env.NOTIFICATION_RABBITMQ_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
  ) {
    super(dataSource);
  }

  protected async execute(data: CreatedUserObj, manager: EntityManager): Promise<User> {
    const createdUser = await this.userService.createWithEntityManager(data.createdUser, manager);
    await this.notificationClientProxy
      .send('created_user', { createdUser: data.createdUser, currentUser: data.currentUser })
      .toPromise();
    return createdUser;
  }
}
