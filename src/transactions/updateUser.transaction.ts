import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { UserService } from 'src/services';
import { UpdatedUserObj } from 'src/types';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'src/entities';

@Injectable()
export class UpdateUserTransaction extends BaseTransaction<UpdatedUserObj, User> {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(process.env.NOTIFICATION_RABBITMQ_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
  ) {
    super(dataSource);
  }

  protected async execute(data: UpdatedUserObj, manager: EntityManager): Promise<User> {
    const updatedUser = await this.userService.updateWithEntityManager(
      data.updatedUser,
      data.currentUser,
      manager,
    );
    await this.notificationClientProxy
      .send('updated_user', { updatedUser: data.updatedUser, currentUser: data.currentUser })
      .toPromise();
    return updatedUser;
  }
}
