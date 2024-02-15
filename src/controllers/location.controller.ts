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
import { ErrorDto, LocationListFiltersDto } from 'src/dtos';
import { Location, User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { LocationService } from 'src/services';
import { ParseLocationListFiltersPipe } from 'src/pipes';
import { LocationsSerializerInterceptor } from 'src/interceptors';

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
    @Query('page', ParseIntPipe) page: number,
    @Query('take', ParseIntPipe) take: number,
    @Query('filters', ParseLocationListFiltersPipe) filters: LocationListFiltersDto,
    @CurrentUser() user: User,
  ): Promise<[Location[], number]> {
    return this.locationService.findAll(page, take, filters, user);
  }
}
