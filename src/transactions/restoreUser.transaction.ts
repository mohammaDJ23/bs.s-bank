import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BillService, UserService } from 'src/services';
import { RestoredUserObj, RestoredUserWithBillsObj } from 'src/types';
import { DataSource, EntityManager } from 'typeorm';
import { BaseTransaction } from './base.transaction';

@Injectable()
export class RestoreUserTransaction extends BaseTransaction<RestoredUserObj, RestoredUserWithBillsObj> {
  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
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
    return { restoredUser, restoredBills };
  }
}
