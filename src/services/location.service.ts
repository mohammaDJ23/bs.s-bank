import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Location, User } from '../entities';
import { CreateBillDto, LocationListFiltersDto, UpdateBillDto, UpdateLocationDto } from 'src/dtos';

@Injectable()
export class LocationService {
  constructor(@InjectRepository(Location) private readonly locationRepository: Repository<Location>) {}

  async createWithEntityManager(
    manager: EntityManager,
    payload: CreateBillDto | UpdateBillDto,
    user: User,
  ): Promise<Location> {
    const findedLocation = await manager
      .createQueryBuilder(Location, 'location')
      .withDeleted()
      .where('location.name = :location')
      .andWhere('location.user_id = :userId')
      .setParameters({ location: payload.location, userId: user.id })
      .getOne();
    if (!findedLocation) {
      return manager
        .createQueryBuilder()
        .insert()
        .orIgnore(true)
        .into(Location)
        .values(manager.create(Location, { name: payload.location, user }))
        .returning('*')
        .exe();
    }
    return findedLocation;
  }

  findAll(
    page: number,
    take: number,
    filters: LocationListFiltersDto,
    user: User,
  ): Promise<[Location[], number]> {
    return this.locationRepository
      .createQueryBuilder('location')
      .where('location.user_id = :userId')
      .andWhere(
        new Brackets((query) =>
          query
            .where('to_tsvector(location.name) @@ plainto_tsquery(:q)')
            .orWhere("location.name ILIKE '%' || :q || '%'"),
        ),
      )
      .orderBy('location.createdAt', 'DESC')
      .take(take)
      .skip((page - 1) * take)
      .setParameters({ userId: user.id, q: filters.q })
      .getManyAndCount();
  }

  async delete(id: number, user: User): Promise<Location> {
    return this.locationRepository
      .createQueryBuilder('location')
      .softDelete()
      .where('location.user_id = :userId')
      .andWhere('location.id = :locationId')
      .setParameters({ userId: user.id, locationId: id })
      .returning('*')
      .exe();
  }

  async update(payload: UpdateLocationDto, user: User): Promise<Location> {
    const findedLocation = await this.locationRepository
      .createQueryBuilder('location')
      .withDeleted()
      .where('location.user_id = :userId')
      .andWhere('location.name = :locationName')
      .andWhere('location.id != :locationId')
      .setParameters({ userId: user.id, locationName: payload.name, locationId: payload.id })
      .getOne();

    if (findedLocation) throw new BadRequestException('A location with this name exist.');

    return this.locationRepository
      .createQueryBuilder('location')
      .update(Location)
      .set(payload)
      .where('location.user_id = :userId')
      .andWhere('location.id = :locationId')
      .setParameters({ userId: user.id, locationId: payload.id })
      .returning('*')
      .exe();
  }

  async deleteManyWithEntityManager(manager: EntityManager, payload: User): Promise<void> {
    await manager
      .createQueryBuilder(Location, 'location')
      .softDelete()
      .where('location.user_id = :id')
      .setParameters({ id: payload.id })
      .execute();
  }

  async restoreManyWithEntityManager(manager: EntityManager, payload: User): Promise<void> {
    await manager
      .createQueryBuilder(Location, 'location')
      .restore()
      .where('location.user_id = :id')
      .setParameters({ id: payload.id })
      .execute();
  }
}
