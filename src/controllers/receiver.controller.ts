import {
  Controller,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';
import { ErrorDto, ReceiverListFiltersDto } from 'src/dtos';
import { Receiver, User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { ReceiverService } from 'src/services';
import { ParseReceiverListFiltersPipe } from 'src/pipes';
import { ReceiversSerializerInterceptor } from 'src/interceptors';

@UseGuards(JwtGuard)
@Controller('/api/v1/bank')
@ApiTags('/api/v1/bank')
export class ReceiverController {
  constructor(private readonly receiverService: ReceiverService) {}

  @Get('receiver/all')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ReceiversSerializerInterceptor)
  @ApiQuery({ name: 'page', type: 'number' })
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiQuery({ name: 'filters', type: ReceiverListFiltersDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: ReceiverListFiltersDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('take', ParseIntPipe) take: number,
    @Query('filters', ParseReceiverListFiltersPipe) filters: ReceiverListFiltersDto,
    @CurrentUser() user: User,
  ): Promise<[Receiver[], number]> {
    return this.receiverService.findAll(page, take, filters, user);
  }
}
