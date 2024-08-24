import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Header,
  StreamableFile,
  Query,
  UseInterceptors,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBody, ApiTags, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, DissimilarRoles, Roles, SameRoles } from 'src/decorators';
import {
  BillDto,
  CreateBillDto,
  UpdateBillDto,
  LastYearDto,
  ErrorDto,
  UpdatedBillDto,
  DeletedBillDto,
  BillListFiltersDto,
  DeletedBillListFiltersDto,
  CreatedBillDto,
  RestoredBillDto,
  AllBillListFiltersDto,
  QuantitiesDto,
  QuantitiesDeletedDto,
  MostActiveUsersDto,
} from 'src/dtos';
import { Bill, User } from 'src/entities';
import { DissimilarRolesGuard, JwtGuard, RolesGuard, SameRolesGuard } from 'src/guards';
import { BillService } from 'src/services';
import { ParseAllBillListFiltersPipe, ParseBillListFiltersPipe } from 'src/pipes';
import {
  BillsSerializerInterceptor,
  BillSerializerInterceptor,
  CreatedBillSerializerInterceptor,
  DeletedBillsSerializerInterceptor,
  DeletedBillSerializerInterceptor,
  LastYearBillsSerializerInterceptor,
  RestoredBillSerializerInterceptor,
  UpdatedBillSerializerInterceptor,
  CacheInterceptor,
  ResetCacheInterceptor,
  QuantitiesSerializerInterceptor,
  QuantitiesDeletedSerializerInterceptor,
  AllQuantitiesSerializerInterceptor,
  AllQuantitiesDeletedSerializerInterceptor,
  MostActiveUsersSerializerInterceptor,
} from 'src/interceptors';
import { UserRoles } from 'src/types';

@UseGuards(JwtGuard)
@Controller('/api/v1/bank')
@ApiTags('/api/v1/bank')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post('bill/create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ResetCacheInterceptor, CreatedBillSerializerInterceptor)
  @ApiBody({ type: CreateBillDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.CREATED, type: CreatedBillDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  create(@Body() body: CreateBillDto, @CurrentUser() user: User): Promise<Bill> {
    return this.billService.create(body, user);
  }

  @Put('bill/update')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ResetCacheInterceptor, UpdatedBillSerializerInterceptor)
  @ApiBody({ type: UpdateBillDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: UpdatedBillDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorDto })
  update(@Body() body: UpdateBillDto, @CurrentUser() user: User): Promise<Bill> {
    return this.billService.update(body, user);
  }

  @Delete('bill/delete')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ResetCacheInterceptor, DeletedBillSerializerInterceptor)
  @ApiQuery({ name: 'id', type: 'string' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: DeletedBillDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  delete(@Query('id') id: string, @CurrentUser() user: User): Promise<Bill> {
    return this.billService.delete(id, user);
  }

  @Get('bill/quantities')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor, QuantitiesSerializerInterceptor)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: QuantitiesDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  quantities(@CurrentUser() user: User): Promise<QuantitiesDto> {
    return this.billService.quantities(user);
  }

  @Get('bill/deleted-quantities')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @UseInterceptors(CacheInterceptor, QuantitiesDeletedSerializerInterceptor)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: QuantitiesDeletedDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  quantitiesDeleted(@CurrentUser() user: User): Promise<QuantitiesDeletedDto> {
    return this.billService.quantitiesDeleted(user);
  }

  @Get('bill/last-year')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(LastYearBillsSerializerInterceptor)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: LastYearDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  lastYear(@CurrentUser() user: User): Promise<LastYearDto[]> {
    return this.billService.lastYear(user);
  }

  @Get('bill/excel/:id')
  @HttpCode(HttpStatus.OK)
  @SameRoles(UserRoles.ADMIN, UserRoles.USER)
  @DissimilarRoles(UserRoles.OWNER)
  @UseGuards(SameRolesGuard, DissimilarRolesGuard)
  @ApiParam({ name: 'id', type: 'number' })
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="bill-reports.xlsx"')
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: StreamableFile })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  report(@Param('id') id: number): Promise<StreamableFile> {
    return this.billService.report(id);
  }

  @Get('owner/bill/all')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoles.OWNER)
  @UseGuards(RolesGuard)
  @UseInterceptors(BillsSerializerInterceptor)
  @ApiQuery({ name: 'page', type: 'number' })
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiQuery({ name: 'filters', type: AllBillListFiltersDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: BillDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('take', ParseIntPipe) take: number,
    @Query('filters', ParseAllBillListFiltersPipe) filters: AllBillListFiltersDto,
  ): Promise<[Bill[], number]> {
    return this.billService.findAll(page, take, filters);
  }

  @Get('owner/bill/most-active-users')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoles.OWNER)
  @UseGuards(RolesGuard)
  @UseInterceptors(MostActiveUsersSerializerInterceptor)
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: MostActiveUsersDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  mostActiveUsers(
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ): Promise<MostActiveUsersDto[]> {
    return this.billService.mostActiveUsers(take);
  }

  @Get('bill/all')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor, BillsSerializerInterceptor)
  @ApiQuery({ name: 'page', type: 'number' })
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiQuery({ name: 'filters', type: BillListFiltersDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: BillDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findAllByUserId(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('filters', new DefaultValuePipe(new BillListFiltersDto()), ParseBillListFiltersPipe)
    filters: BillListFiltersDto,
    @CurrentUser() user: User,
  ): Promise<[Bill[], number]> {
    return this.billService.findAllByUserId(page, take, filters, user);
  }

  @Get('bill/all/quantities')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoles.OWNER, UserRoles.ADMIN)
  @UseGuards(RolesGuard)
  @UseInterceptors(CacheInterceptor, AllQuantitiesSerializerInterceptor)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: QuantitiesDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  Allquantities(): Promise<QuantitiesDto> {
    return this.billService.allQuantities();
  }

  @Get('bill/all/deleted-quantities')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoles.OWNER, UserRoles.ADMIN)
  @UseGuards(RolesGuard)
  @UseInterceptors(CacheInterceptor, AllQuantitiesDeletedSerializerInterceptor)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: QuantitiesDeletedDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  allQuantitiesDeleted(): Promise<QuantitiesDeletedDto> {
    return this.billService.allQuantitiesDeleted();
  }

  @Get('bill/all/deleted')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor, DeletedBillsSerializerInterceptor)
  @ApiQuery({ name: 'page', type: 'number' })
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiQuery({ name: 'filters', type: DeletedBillListFiltersDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: BillDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findAllDeleted(
    @Query('page', ParseIntPipe) page: number,
    @Query('take', ParseIntPipe) take: number,
    @Query('filters', ParseBillListFiltersPipe)
    filters: DeletedBillListFiltersDto,
    @CurrentUser() user: User,
  ): Promise<[Bill[], number]> {
    return this.billService.findAllDeleted(page, take, filters, user);
  }

  @Get('bill/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor, BillSerializerInterceptor)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: BillDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findById(@Param('id') id: string, @CurrentUser() user: User): Promise<Bill> {
    return this.billService.findById(id, user);
  }

  @Get('bill/deleted/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor, DeletedBillSerializerInterceptor)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: DeletedBillDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findByIdDeleted(@Param('id') id: string, @CurrentUser() user: User): Promise<Bill> {
    return this.billService.findByIdDeleted(id, user);
  }

  @Post('bill/restore/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ResetCacheInterceptor, RestoredBillSerializerInterceptor)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: RestoredBillDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  restore(@Param('id') id: string, @CurrentUser() user: User): Promise<Bill> {
    return this.billService.restore(id, user);
  }
}
