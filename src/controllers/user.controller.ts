import {
  Controller,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SameRoles } from 'src/decorators';
import { ErrorDto, UserWithBillInfoDto } from 'src/dtos';
import { JwtGuard, SameRolesGuard } from 'src/guards';
import { UserService } from 'src/services';
import { UserWithBillInfoSerializerInterceptor, CacheInterceptor } from 'src/interceptors';
import { UserRoles } from 'src/types';

@UseGuards(JwtGuard)
@Controller('/api/v1/bank')
@ApiTags('/api/v1/bank')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  @SameRoles(UserRoles.USER)
  @UseGuards(SameRolesGuard)
  @UseInterceptors(CacheInterceptor, UserWithBillInfoSerializerInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: UserWithBillInfoDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findByIdWithBillSummary(@Param('id', ParseIntPipe) id: number): Promise<UserWithBillInfoDto> {
    return this.userService.findByIdWithBillSummary(id);
  }
}
