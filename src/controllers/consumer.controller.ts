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
  Delete,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';
import {
  ErrorDto,
  ConsumerListFiltersDto,
  UpdateConsumerDto,
  ConsumerDto,
  MostActiveConsumersDto,
} from 'src/dtos';
import { Consumer, User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { ConsumerService } from 'src/services';
import { ParseConsumerListFiltersPipe } from 'src/pipes';
import {
  ConsumerSerializerInterceptor,
  ConsumersSerializerInterceptor,
  MostActiveConsumersSerializerInterceptor,
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

  @Delete('consumer/delete')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ResetCacheInterceptor, ConsumerSerializerInterceptor)
  @ApiQuery({ name: 'id', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: ConsumerDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  delete(@Query('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<Consumer> {
    return this.consumerService.delete(id, user);
  }

  @Get('consumer/most-active-consumers')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(MostActiveConsumersSerializerInterceptor)
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: MostActiveConsumersDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  mostActive(
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @CurrentUser() user: User,
  ): Promise<MostActiveConsumersDto[]> {
    return this.consumerService.mostActive(user, take);
  }

  @Get('consumer/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ConsumerSerializerInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: ConsumerDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<Consumer> {
    return this.consumerService.findById(id, user);
  }
}
