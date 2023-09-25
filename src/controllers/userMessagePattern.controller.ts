import { Controller, UseInterceptors } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { User } from 'src/entities';
import { ResetCacheMicroserviceInterceptor } from 'src/interceptors';
import { UserService } from 'src/services';
import {
  CreatedUserObj,
  DeletedUserObj,
  RestoredUserWithBillsObj,
  RestoredUserObj,
  UpdatedUserObj,
  DeletedUserWithBillsObj,
} from 'src/types';

@Controller('/message-patterns/v1/bank')
export class UserMessagePatternController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('created_user')
  create(@Payload() payload: CreatedUserObj, @Ctx() context: RmqContext): Promise<User> {
    return this.userService.create(payload, context);
  }

  @MessagePattern('updated_user')
  @UseInterceptors(ResetCacheMicroserviceInterceptor)
  update(@Payload() payload: UpdatedUserObj, @Ctx() context: RmqContext): Promise<User> {
    return this.userService.update(payload, context);
  }

  @MessagePattern('deleted_user')
  @UseInterceptors(ResetCacheMicroserviceInterceptor)
  delete(@Payload() payload: DeletedUserObj, @Ctx() context: RmqContext): Promise<DeletedUserWithBillsObj> {
    return this.userService.delete(payload, context);
  }

  @MessagePattern('restored_user')
  @UseInterceptors(ResetCacheMicroserviceInterceptor)
  restore(
    @Payload() payload: RestoredUserObj,
    @Ctx() context: RmqContext,
  ): Promise<RestoredUserWithBillsObj> {
    return this.userService.restore(payload, context);
  }
}
