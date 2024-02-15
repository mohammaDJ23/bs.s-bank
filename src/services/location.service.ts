import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Bill, Location, User } from '../entities';
import { LocationListFiltersDto } from 'src/dtos';

@Injectable()
export class LocationService {
  constructor(@InjectRepository(Location) private readonly locationRepository: Repository<Location>) {}

  async createWithEntityManager(manager: EntityManager, payload: Bill, user: User): Promise<void> {
    const findedLocation = await manager
      .createQueryBuilder(Location, 'location')
      .where('location.name = :location')
      .andWhere('location.user_id = :userId')
      .setParameters({ location: payload.location, userId: user.id })
      .getOne();
    if (!findedLocation) {
      const newLocation = manager.create(Location, { name: payload.location, user });
      await manager.createQueryBuilder().insert().orIgnore(true).into(Location).values(newLocation).execute();
    }
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
