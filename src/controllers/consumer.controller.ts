import {
  Controller,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  ParseIntPipe,
  Query,
  UseInterceptors,
  DefaultValuePipe,
  Put,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';
import { ErrorDto, ConsumerListFiltersDto, UpdateConsumerDto } from 'src/dtos';
import { Consumer, User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { ConsumerService } from 'src/services';
import { ParseConsumerListFiltersPipe } from 'src/pipes';
import {
  ConsumerSerializerInterceptor,
  ConsumersSerializerInterceptor,
  ResetCacheInterceptor,
} from 'src/interceptors';

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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('filters', new DefaultValuePipe(new ConsumerListFiltersDto()), ParseConsumerListFiltersPipe)
    filters: ConsumerListFiltersDto,
    @CurrentUser() user: User,
  ): Promise<[Consumer[], number]> {
    return this.consumerService.findAll(page, take, filters, user);
  }

  @Put('consumer/update')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ResetCacheInterceptor, ConsumerSerializerInterceptor)
  @ApiBody({ type: UpdateConsumerDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: Consumer })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  update(@Body() body: UpdateConsumerDto, @CurrentUser() user: User): Promise<Consumer> {
    return this.consumerService.update(body, user);
  }
}
