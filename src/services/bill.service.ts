import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  LastYearDto,
  UpdateBillDto,
  CreateBillDto,
  BillListFiltersDto,
  DeletedBillListFiltersDto,
  AllBillListFiltersDto,
  QuantitiesDto,
  QuantitiesDeletedDto,
  MostActiveUsersDto,
} from 'src/dtos';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Bill, Consumer, Receiver, User, Location } from '../entities';
import { createReadStream, existsSync, unlink, rmdir, readdir, rm } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { Workbook } from 'exceljs';
import { UserService } from './user.service';
import { CreateBillTransaction, UpdateBillTransaction } from 'src/transactions';

@Injectable()
export class BillService {
  constructor(
    @InjectRepository(Bill) private readonly billRepository: Repository<Bill>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => CreateBillTransaction))
    private readonly createBillTransaction: CreateBillTransaction,
    @Inject(forwardRef(() => UpdateBillTransaction))
    private readonly updateBillTransaction: UpdateBillTransaction,
  ) {}

  async createWithEntityManager(
    manager: EntityManager,
    payload: CreateBillDto,
    location: Location,
    receiver: Receiver,
    consumers: Consumer[],
    user: User,
  ): Promise<Bill> {
    const bill = manager.create(Bill, {
      amount: payload.amount,
      description: payload.description,
      date: payload.date,
      user,
      location,
      receiver,
      consumers,
    });
    return manager.save(bill);
  }

  async create(payload: CreateBillDto, user: User): Promise<Bill> {
    return this.createBillTransaction.run(payload, user);
  }

  async updateWithEntityManager(
    manager: EntityManager,
    payload: UpdateBillDto,
    location: Location,
    receiver: Receiver,
    consumers: Consumer[],
    user: User,
  ): Promise<Bill> {
    const bill = await this.findById(payload.id, user);

    bill.amount = payload.amount;
    bill.description = payload.description;
    bill.date = payload.date;
    bill.location = location;
    bill.receiver = receiver;
    bill.consumers = consumers;

    return manager.save(bill);
  }

  async update(payload: UpdateBillDto, user: User): Promise<Bill> {
    return this.updateBillTransaction.run(payload, user);
  }

  async deleteManyWithEntityManager(manager: EntityManager, payload: User): Promise<Bill[]> {
    return manager
      .createQueryBuilder(Bill, 'bill')
      .softDelete()
      .where('bill.user_id = :id')
      .andWhere('bill.deleted_at IS NULL')
      .setParameters({ id: payload.id })
      .returning('*')
      .exe({ resultType: 'array' });
  }

  async delete(id: string, user: User): Promise<Bill> {
    return this.billRepository
      .createQueryBuilder('bill')
      .softDelete()
      .where('bill.user_id = :userId')
      .andWhere('bill.id = :billId')
      .setParameters({ userId: user.id, billId: id })
      .returning('*')
      .exe({ noEffectError: 'Could not delete the bill.' });
  }

  async findById(id: string, user: User): Promise<Bill> {
    return this.billRepository
      .createQueryBuilder('bill')
      .withDeleted()
      .leftJoinAndSelect('bill.user', 'user')
      .leftJoinAndSelect('bill.location', 'location')
      .leftJoinAndSelect('bill.receiver', 'receiver')
      .leftJoinAndSelect('bill.consumers', 'consumers')
      .where('user.id = :userId')
      .andWhere('bill.id = :billId')
      .andWhere('bill.deletedAt IS NULL')
      .setParameters({ billId: id, userId: user.id })
      .getOneOrFail();
  }

  async findAll(page: number, take: number, filters: AllBillListFiltersDto): Promise<[Bill[], number]> {
    return this.billRepository
      .createQueryBuilder('bill')
      .withDeleted()
      .leftJoinAndSelect('bill.user', 'user')
      .leftJoinAndSelect('bill.receiver', 'receiver')
      .leftJoinAndSelect('bill.consumers', 'consumers')
      .leftJoinAndSelect('bill.location', 'location')
      .where(
        new Brackets((query) =>
          query
            .where('to_tsvector(receiver.name) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.description) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.amount) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(user.firstName) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(user.lastName) @@ plainto_tsquery(:q)')
            .orWhere("receiver.name ILIKE '%' || :q || '%'")
            .orWhere("bill.description ILIKE '%' || :q || '%'")
            .orWhere("bill.amount ILIKE '%' || :q || '%'")
            .orWhere("user.firstName ILIKE '%' || :q || '%'")
            .orWhere("user.lastName ILIKE '%' || :q || '%'"),
        ),
      )
      .andWhere('bill.deletedAt IS NULL')
      .andWhere('user.role = ANY(:roles)')
      .andWhere(
        'CASE WHEN (:fromDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(bill.date)) * 1000, 0)::BIGINT >= (:fromDate)::BIGINT ELSE TRUE END',
      )
      .andWhere(
        'CASE WHEN (:toDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(bill.date)) * 1000, 0)::BIGINT <= (:toDate)::BIGINT ELSE TRUE END',
      )
      .orderBy('bill.createdAt', 'DESC')
      .take(take)
      .skip((page - 1) * take)
      .setParameters({
        q: filters.q,
        roles: filters.roles,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      })
      .getManyAndCount();
  }

  async findAllByUserId(
    page: number,
    take: number,
    filters: BillListFiltersDto,
    user: User,
  ): Promise<[Bill[], number]> {
    return this.billRepository
      .createQueryBuilder('bill')
      .withDeleted()
      .leftJoinAndSelect('bill.user', 'user')
      .leftJoinAndSelect('bill.receiver', 'receiver')
      .leftJoinAndSelect('bill.consumers', 'consumers')
      .leftJoinAndSelect('bill.location', 'location')
      .where('user.id = :userId')
      .andWhere('bill.deletedAt IS NULL')
      .andWhere(
        new Brackets((query) =>
          query
            .where('to_tsvector(receiver.name) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.description) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.amount) @@ plainto_tsquery(:q)')
            .orWhere("receiver.name ILIKE '%' || :q || '%'")
            .orWhere("bill.description ILIKE '%' || :q || '%'")
            .orWhere("bill.amount ILIKE '%' || :q || '%'"),
        ),
      )
      .andWhere(
        'CASE WHEN (:fromDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(bill.date)) * 1000, 0)::BIGINT >= (:fromDate)::BIGINT ELSE TRUE END',
      )
      .andWhere(
        'CASE WHEN (:toDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(bill.date)) * 1000, 0)::BIGINT <= (:toDate)::BIGINT ELSE TRUE END',
      )
      .orderBy('bill.createdAt', 'DESC')
      .take(take)
      .skip((page - 1) * take)
      .setParameters({
        userId: user.id,
        q: filters.q,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      })
      .getManyAndCount();
  }

  async findAllDeleted(
    page: number,
    take: number,
    filters: DeletedBillListFiltersDto,
    user: User,
  ): Promise<[Bill[], number]> {
    return this.billRepository
      .createQueryBuilder('bill')
      .withDeleted()
      .leftJoinAndSelect('bill.receiver', 'receiver')
      .leftJoinAndSelect('bill.consumers', 'consumers')
      .leftJoinAndSelect('bill.location', 'location')
      .where('bill.user_id = :userId')
      .andWhere('bill.deletedAt IS NOT NULL')
      .andWhere(
        new Brackets((query) =>
          query
            .where('to_tsvector(receiver.name) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.description) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.amount) @@ plainto_tsquery(:q)')
            .orWhere("receiver.name ILIKE '%' || :q || '%'")
            .orWhere("bill.description ILIKE '%' || :q || '%'")
            .orWhere("bill.amount ILIKE '%' || :q || '%'"),
        ),
      )
      .andWhere(
        'CASE WHEN (:fromDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(bill.date)) * 1000, 0)::BIGINT >= (:fromDate)::BIGINT ELSE TRUE END',
      )
      .andWhere(
        'CASE WHEN (:toDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(bill.date)) * 1000, 0)::BIGINT <= (:toDate)::BIGINT ELSE TRUE END',
      )
      .andWhere(
        'CASE WHEN (:deletedDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(bill.deletedAt)) * 1000, 0)::BIGINT = (:deletedDate)::BIGINT ELSE TRUE END',
      )
      .orderBy('bill.deletedAt', 'DESC')
      .take(take)
      .skip((page - 1) * take)
      .setParameters({
        userId: user.id,
        q: filters.q,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        deletedDate: filters.deletedDate,
      })
      .getManyAndCount();
  }

  quantities(user: User): Promise<QuantitiesDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.amount::BIGINT), 0)::TEXT', 'amount')
      .addSelect('COALESCE(COUNT(bill.id), 0)', 'quantities')
      .where('bill.user_id = :userId')
      .setParameters({ userId: user.id })
      .getRawOne();
  }

  quantitiesDeleted(user: User): Promise<QuantitiesDeletedDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.amount::BIGINT), 0)::TEXT', 'amount')
      .addSelect('COALESCE(COUNT(bill.id), 0)', 'quantities')
      .withDeleted()
      .where('bill.deletedAt IS NOT NULL')
      .andWhere('bill.user_id = :userId')
      .setParameters({ userId: user.id })
      .getRawOne();
  }

  allQuantities(): Promise<QuantitiesDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.amount::BIGINT), 0)::TEXT', 'amount')
      .addSelect('COALESCE(COUNT(bill.id), 0)', 'quantities')
      .getRawOne();
  }

  allQuantitiesDeleted(): Promise<QuantitiesDeletedDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.amount::BIGINT), 0)::TEXT', 'amount')
      .addSelect('COALESCE(COUNT(bill.id), 0)', 'quantities')
      .withDeleted()
      .where('bill.deletedAt IS NOT NULL')
      .getRawOne();
  }

  async lastYear(user: User): Promise<LastYearDto[]> {
    return this.billRepository.query(
      `
        WITH lastYear (date) AS (
          SELECT t.day::date FROM generate_series(
            (NOW() - INTERVAL '1 YEAR')::timestamp,
            NOW()::timestamp,
            '1 day'::interval
          ) as t(day)
        ) 
        SELECT
          COALESCE(EXTRACT(EPOCH FROM lastYear.date) * 1000, 0)::BIGINT AS date,
          COALESCE(SUM(bill.amount::BIGINT), 0)::BIGINT AS amount,
          COUNT(bill.id)::INTEGER as count
        FROM lastYear
        FULL JOIN bill ON
          to_char(lastYear.date, 'YYYY-MM-DD') = to_char(bill.created_at, 'YYYY-MM-DD') AND
            bill.user_id = $1 AND
            bill.deleted_at IS NULL
        WHERE lastYear.date IS NOT NULL
        GROUP BY lastYear.date
        ORDER BY lastYear.date ASC;
      `,
      [user.id],
    );
  }

  private getBillReportPath(): string {
    return join(process.cwd(), '/reports');
  }

  async report(id: number): Promise<StreamableFile> {
    const user = await this.userService.findById(id);

    if (!user) throw new NotFoundException('Could not found the user.');

    const fileName = `${user.firstName}-${user.lastName}-${user.id}.xlsx`;
    const path = this.getBillReportPath();
    const filePath = join(path, fileName);

    if (!existsSync(path)) {
      await mkdir(path, { recursive: true });
    }

    const workbook = new Workbook();
    const workSheet = workbook.addWorksheet('bills');
    const billPropertiesMap = this.billRepository.metadata.propertiesMap;
    const propertyNames = Object.values(billPropertiesMap);
    workSheet.columns = propertyNames.map((propertyName) => ({
      header: propertyName,
      key: propertyName,
      width: 20,
    }));

    const bills = await this.billRepository
      .createQueryBuilder('bill')
      .withDeleted()
      .leftJoinAndSelect('bill.user', 'user')
      .leftJoinAndSelect('bill.receiver', 'receiver')
      .leftJoinAndSelect('bill.location', 'location')
      .leftJoinAndSelect('bill.consumers', 'consumers')
      .where('bill.user_id = :userId')
      .andWhere('bill.deletedAt IS NULL')
      .orderBy('bill.createdAt', 'ASC')
      .setParameters({ userId: user.id })
      .getMany();
    if (bills.length) {
      workSheet.addRows(
        bills.map((bill) => ({
          ...bill,
          user: bill.user.firstName + ' ' + bill.user.lastName,
          receiver: bill.receiver.name,
          location: bill.location.name,
          consumers: bill.consumers.map((consumer) => consumer.name).join(', '),
        })),
      );
    }

    await workbook.xlsx.writeFile(filePath);

    const readedFile = createReadStream(filePath);
    return new Promise<StreamableFile>((resolve, reject) => {
      readedFile.on('ready', () => {
        resolve(new StreamableFile(readedFile));
        unlink(filePath, (err) => {
          if (err) console.log(err);
        });
      });
      readedFile.on('error', (err: Error) => reject(new InternalServerErrorException(err.message)));
    });
  }

  removeReport(): void {
    const path = this.getBillReportPath();
    if (existsSync(path))
      readdir(path, (err, data) => {
        if (err) console.log(err.message);
        else {
          if (data.length <= 0) {
            rmdir(path, (err) => {
              if (err) console.log(err);
            });
          } else {
            rm(path, { recursive: true, force: true }, (err) => {
              if (err) console.log(err);
            });
          }
        }
      });
  }

  async restoreManyWithEntityManager(manager: EntityManager, payload: User): Promise<Bill[]> {
    return manager
      .createQueryBuilder(Bill, 'bill')
      .restore()
      .where('bill.user_id = :id')
      .andWhere('bill.deleted_at IS NOT NULL')
      .setParameters({ id: payload.id })
      .returning('*')
      .exe({ resultType: 'array' });
  }

  async restore(id: string, user: User): Promise<Bill> {
    return this.billRepository
      .createQueryBuilder('bill')
      .restore()
      .where('bill.user_id = :userId')
      .andWhere('bill.id = :billId')
      .setParameters({ billId: id, userId: user.id })
      .returning('*')
      .exe({ noEffectError: 'Could not restore the bill.' });
  }

  findByIdDeleted(id: string, user: User): Promise<Bill> {
    return this.billRepository
      .createQueryBuilder('bill')
      .withDeleted()
      .leftJoinAndSelect('bill.receiver', 'receiver')
      .leftJoinAndSelect('bill.consumers', 'consumers')
      .leftJoinAndSelect('bill.location', 'location')
      .where('bill.deletedAt IS NOT NULL')
      .andWhere('bill.id = :billId')
      .andWhere('bill.user_id = :userId')
      .setParameters({ billId: id, userId: user.id })
      .getOneOrFail();
  }

  async mostActiveUsers(take: number): Promise<MostActiveUsersDto[]> {
    return this.billRepository.query(
      `
        SELECT COALESCE(b.quantities, 0) as quantities,
          json_build_object(
            'id', u.id,
            'firstName', u.first_name,
            'lastName', u.last_name,
            'email', u.email,
            'phone', u.phone,
            'role', u.role,
            'createdBy', u.created_by,
            'createdAt', u.created_at,
            'updatedAt', u.updated_at,
            'deletedAt', u.deleted_at,
            'parent', json_build_object(
              'id', u2.id,
              'firstName', u2.first_name,
              'lastName', u2.last_name,
              'email', u2.email,
              'phone', u2.phone,
              'role', u2.role,
              'createdBy', u2.created_by,
              'createdAt', u2.created_at,
              'updatedAt', u2.updated_at,
              'deletedAt', u2.deleted_at
            )
          ) AS user
        FROM public.user as u

        LEFT JOIN (
          SELECT COUNT(b.id) AS quantities, b.user_id
          FROM public.bill AS b
          WHERE b.deleted_at IS NULL
          GROUP BY b.user_id
        ) b ON b.user_id = u.id

        LEFT JOIN (
          SELECT * FROM public.user AS u2
        ) u2 ON u2.id = u.created_by

        WHERE u.deleted_at IS NULL AND quantities > 0

        ORDER BY quantities DESC
        
        LIMIT $1;
      `,
      [take],
    );
  }
}
