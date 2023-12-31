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
import { ErrorDto, ConsumerListFiltersDto } from 'src/dtos';
import { Consumer, User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { ConsumerService } from 'src/services';
import { ParseConsumerListFiltersPipe } from 'src/pipes';
import { ConsumersSerializerInterceptor } from 'src/interceptors';

@UseGuards(JwtGuard)
@Controller('/api/v1/bank')
@ApiTags('/api/v1/bank')
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}

  @Get('consumer/all')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ConsumersSerializerInterceptor)
  @ApiQuery({ name: 'page', type: 'number' })
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiQuery({ name: 'filters', type: ConsumerListFiltersDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: ConsumerListFiltersDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('take', ParseIntPipe) take: number,
    @Query('filters', ParseConsumerListFiltersPipe) filters: ConsumerListFiltersDto,
    @CurrentUser() user: User,
  ): Promise<[Consumer[], number]> {
    return this.consumerService.findAll(page, take, filters, user);
  }
}
