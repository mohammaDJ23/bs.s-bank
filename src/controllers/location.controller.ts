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
import { ErrorDto, LocationDto, LocationListFiltersDto, UpdateLocationDto } from 'src/dtos';
import { Location, User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { LocationService } from 'src/services';
import { ParseLocationListFiltersPipe } from 'src/pipes';
import {
  LocationSerializerInterceptor,
  LocationsSerializerInterceptor,
  ResetCacheInterceptor,
} from 'src/interceptors';

@UseGuards(JwtGuard)
@Controller('/api/v1/bank')
@ApiTags('/api/v1/bank')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('location/all')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(LocationsSerializerInterceptor)
  @ApiQuery({ name: 'page', type: 'number' })
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiQuery({ name: 'filters', type: LocationListFiltersDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: LocationListFiltersDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('filters', new DefaultValuePipe(new LocationListFiltersDto()), ParseLocationListFiltersPipe)
    filters: LocationListFiltersDto,
    @CurrentUser() user: User,
  ): Promise<[Location[], number]> {
    return this.locationService.findAll(page, take, filters, user);
  }

  @Put('location/update')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ResetCacheInterceptor, LocationsSerializerInterceptor)
  @ApiBody({ type: UpdateLocationDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: Location })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  update(@Body() body: UpdateLocationDto, @CurrentUser() user: User): Promise<Location> {
    return this.locationService.update(body, user);
  }

  @Delete('location/delete')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ResetCacheInterceptor, LocationSerializerInterceptor)
  @ApiQuery({ name: 'id', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: LocationDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  delete(@Query('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<Location> {
    return this.locationService.delete(id, user);
  }

  @Get('location/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(LocationSerializerInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: LocationDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<Location> {
    return this.locationService.findById(id, user);
  }
}
