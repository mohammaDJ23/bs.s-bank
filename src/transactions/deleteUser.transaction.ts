import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, UserService } from 'src/services';
import { DeletedUserObj, DeletedUserWithBillsObj } from 'src/types';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';

@Injectable()
export class DeleteUserTransaction extends BaseTransaction<DeletedUserObj, DeletedUserWithBillsObj> {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
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
    return { deletedUser, deletedBills };
  }
}
