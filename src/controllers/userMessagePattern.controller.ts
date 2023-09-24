import { Controller, UseInterceptors } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { ResetCacheMicroserviceInterceptor } from 'src/interceptors';
import { UserService } from 'src/services';
import {
  CreatedUserObj,
  DeletedUserObj,
  RestoredUserWithBillsObj,
  RestoredUserObj,
  UpdatedUserObj,
} from 'src/types';

@Controller('/message-patterns/v1/bank')
export class UserMessagePatternController {
  constructor(private readonly userService: UserService) {}

  @EventPattern('created_user')
  create(@Payload() payload: CreatedUserObj, @Ctx() context: RmqContext): void {
    this.userService.create(payload, context);
  }

  @EventPattern('updated_user')
  @UseInterceptors(ResetCacheMicroserviceInterceptor)
  update(@Payload() payload: UpdatedUserObj, @Ctx() context: RmqContext): void {
    this.userService.update(payload, context);
  }

  @EventPattern('deleted_user')
  @UseInterceptors(ResetCacheMicroserviceInterceptor)
  delete(@Payload() payload: DeletedUserObj, @Ctx() context: RmqContext): void {
    this.userService.delete(payload, context);
  }

  @MessagePattern('restored_user')
  @UseInterceptors(ResetCacheMicroserviceInterceptor)
  async restore(
    @Payload() payload: RestoredUserObj,
    @Ctx() context: RmqContext,
  ): Promise<RestoredUserWithBillsObj> {
    return this.userService.restore(payload, context);
  }
}
