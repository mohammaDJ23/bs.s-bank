import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Location, User } from '../entities';
import {
  CreateBillDto,
  LocationListFiltersDto,
  MostActiveLocationsDto,
  UpdateBillDto,
  UpdateLocationDto,
} from 'src/dtos';

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
        .into(Location)
        .values(manager.create(Location, { name: payload.location, user }))
        .returning('*')
        .exe({ noEffectError: 'Cound not create location.' });
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

  async findById(id: number, user: User): Promise<Location> {
    return this.locationRepository
      .createQueryBuilder('location')
      .where('location.user_id = :userId')
      .andWhere('location.id = :locationId')
      .setParameters({ locationId: id, userId: user.id })
      .getOneOrFail();
  }

  async delete(id: number, user: User): Promise<Location> {
    return this.locationRepository
      .createQueryBuilder('location')
      .softDelete()
      .where('location.user_id = :userId')
      .andWhere('location.id = :locationId')
      .setParameters({ userId: user.id, locationId: id })
      .returning('*')
      .exe({ noEffectError: 'Could not delete the location.' });
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
      .exe({ noEffectError: 'Could not update the location.' });
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

  mostActive(user: User, take: number): Promise<MostActiveLocationsDto[]> {
    return this.locationRepository.query(
      `
        SELECT COUNT(l.id) AS quantities,
          json_build_object(
            'id', l.id, 
            'name', l.name,
            'createdAt', l.created_at,
            'updatedAt', l.updated_at,
            'deletedAt', l.deleted_at
          ) AS location FROM public.location AS l

        LEFT JOIN (
          SELECT b.location_id, b.deleted_at, id FROM public.bill AS b
          WHERE b.user_id = $1
        ) b ON b.location_id = l.id

        WHERE l.deleted_at IS NULL AND
          l.user_id = $1 AND
          b.deleted_at IS NULL AND
          b.id IS NOT NULL

        GROUP BY l.id

        ORDER BY quantities DESC

        LIMIT $2;
      `,
      [user.id, take],
    );
  }
}
