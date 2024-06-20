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
  Param,
  Delete,
  Put,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';
import { ErrorDto, ReceiverDto, ReceiverListFiltersDto, UpdateReceiverDto } from 'src/dtos';
import { Receiver, User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { ReceiverService } from 'src/services';
import { ParseReceiverListFiltersPipe } from 'src/pipes';
import { ReceiverSerializerInterceptor, ReceiversSerializerInterceptor } from 'src/interceptors';

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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('filters', new DefaultValuePipe(new ReceiverListFiltersDto()), ParseReceiverListFiltersPipe)
    filters: ReceiverListFiltersDto,
    @CurrentUser() user: User,
  ): Promise<[Receiver[], number]> {
    return this.receiverService.findAll(page, take, filters, user);
  }

  @Put('receiver/update')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UpdateReceiverDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: Receiver })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  update(@Body() body: UpdateReceiverDto, @CurrentUser() user: User): Promise<Receiver> {
    return this.receiverService.update(body, user);
  }

  @Delete('receiver/delete')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ReceiverSerializerInterceptor)
  @ApiQuery({ name: 'id', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: ReceiverDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  delete(@Query('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<Receiver> {
    return this.receiverService.delete(id, user);
  }

  @Get('receiver/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ReceiverSerializerInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: ReceiverDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<Receiver> {
    return this.receiverService.findById(id, user);
  }
}
