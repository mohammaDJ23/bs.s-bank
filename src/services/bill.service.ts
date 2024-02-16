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
  LastWeekDto,
  PeriodAmountDto,
  TotalAmountDto,
  TotalAmountWithoutDatesDto,
  UpdateBillDto,
  CreateBillDto,
  BillQuantitiesDto,
  BillListFiltersDto,
  DeletedBillListFiltersDto,
  AllBillListFiltersDto,
} from 'src/dtos';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Bill, User } from '../entities';
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

  createWithEntityManager(manager: EntityManager, payload: CreateBillDto, user: User): Promise<Bill> {
    const createdBill = manager.create(Bill, payload);
    createdBill.user = user;
    return manager.createQueryBuilder().insert().into(Bill).values(createdBill).returning('*').exe();
  }

  async create(payload: CreateBillDto, user: User): Promise<Bill> {
    return this.createBillTransaction.run(payload, user);
  }

  updateWithEntityManager(manager: EntityManager, payload: UpdateBillDto, user: User): Promise<Bill> {
    return manager
      .createQueryBuilder(Bill, 'bill')
      .leftJoinAndSelect('bill.user', 'user')
      .update(Bill)
      .set(payload)
      .where('bill.user_id = :userId')
      .andWhere('bill.id = :billId')
      .setParameters({ userId: user.id, billId: payload.id })
      .returning('*')
      .exe();
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
      .exe();
  }

  async findById(id: string, user: User): Promise<Bill> {
    return this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.user', 'user')
      .where('user.id = :userId')
      .andWhere('bill.id = :billId')
      .setParameters({ billId: id, userId: user.id })
      .getOneOrFail();
  }

  async findAll(page: number, take: number, filters: AllBillListFiltersDto): Promise<[Bill[], number]> {
    return this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.user', 'user')
      .where(
        new Brackets((query) =>
          query
            .where('to_tsvector(bill.receiver) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.description) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.amount) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(user.firstName) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(user.lastName) @@ plainto_tsquery(:q)')
            .orWhere("bill.receiver ILIKE '%' || :q || '%'")
            .orWhere("bill.description ILIKE '%' || :q || '%'")
            .orWhere("bill.amount ILIKE '%' || :q || '%'")
            .orWhere("user.firstName ILIKE '%' || :q || '%'")
            .orWhere("user.lastName ILIKE '%' || :q || '%'"),
        ),
      )
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
      .leftJoinAndSelect('bill.user', 'user')
      .where('user.id = :userId')
      .andWhere(
        new Brackets((query) =>
          query
            .where('to_tsvector(bill.receiver) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.description) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.amount) @@ plainto_tsquery(:q)')
            .orWhere("bill.receiver ILIKE '%' || :q || '%'")
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
      .where('bill.user_id = :userId')
      .withDeleted()
      .andWhere('bill.deletedAt IS NOT NULL')
      .andWhere(
        new Brackets((query) =>
          query
            .where('to_tsvector(bill.receiver) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.description) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(bill.amount) @@ plainto_tsquery(:q)')
            .orWhere("bill.receiver ILIKE '%' || :q || '%'")
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

  async totalAmount(user: User): Promise<TotalAmountDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.user', 'user')
      .select('COALESCE(SUM(bill.amount::BIGINT), 0)::TEXT', 'totalAmount')
      .addSelect('COALESCE(COUNT(bill.id), 0)', 'quantities')
      .addSelect('COALESCE(EXTRACT(EPOCH FROM MIN(bill.date)) * 1000, 0)::BIGINT', 'start')
      .addSelect('COALESCE(EXTRACT(EPOCH FROM MAX(bill.date)) * 1000, 0)::BIGINT', 'end')
      .where('user.id = :userId')
      .setParameters({ userId: user.id })
      .getRawOne();
  }

  async periodAmount(payload: PeriodAmountDto, user: User): Promise<TotalAmountWithoutDatesDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.user', 'user')
      .select('COALESCE(SUM(bill.amount::BIGINT), 0)::TEXT', 'totalAmount')
      .addSelect('COALESCE(COUNT(bill.id), 0)', 'quantities')
      .where('user.id = :userId')
      .andWhere('bill.date::TIMESTAMP >= :start::TIMESTAMP')
      .andWhere('bill.date::TIMESTAMP <= :end::TIMESTAMP')
      .setParameters({
        userId: user.id,
        start: new Date(payload.start),
        end: new Date(payload.end),
      })
      .getRawOne();
  }

  async lastWeek(user: User): Promise<LastWeekDto[]> {
    return this.billRepository.query(
      `
        WITH lastWeek (date) AS (
          VALUES
            (NOW()),
            (NOW() - INTERVAL '1 DAY'),
            (NOW() - INTERVAL '2 DAY'),
            (NOW() - INTERVAL '3 DAY'),
            (NOW() - INTERVAL '4 DAY'),
            (NOW() - INTERVAL '5 DAY'),
            (NOW() - INTERVAL '6 DAY')
        )
        SELECT
          COALESCE(EXTRACT(EPOCH FROM lastWeek.date) * 1000, 0)::BIGINT AS date,
          COALESCE(SUM(bill.amount::BIGINT), 0)::BIGINT AS amount,
          COUNT(bill.id)::INTEGER as count
        FROM lastWeek
        FULL JOIN bill ON
          to_char(lastWeek.date, 'YYYY-MM-DD') = to_char(bill.created_at, 'YYYY-MM-DD') AND 
            bill.user_id = $1 AND 
            bill.deleted_at IS NULL
        WHERE lastWeek.date IS NOT NULL
        GROUP BY lastWeek.date
        ORDER BY lastWeek.date ASC;
      `,
      [user.id],
    );
  }

  allQuantities(): Promise<BillQuantitiesDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .select('COUNT(bill.id)::TEXT', 'quantities')
      .addSelect('SUM(bill.amount::BIGINT)::TEXT', 'amount')
      .getRawOne();
  }

  allQuantitiesDeleted(): Promise<BillQuantitiesDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .select('COUNT(bill.id)::TEXT', 'quantities')
      .addSelect('SUM(bill.amount::BIGINT)::TEXT', 'amount')
      .withDeleted()
      .where('bill.deletedAt IS NOT NULL')
      .getRawOne();
  }

  quantitiesDeleted(user: User): Promise<BillQuantitiesDto> {
    return this.billRepository
      .createQueryBuilder('bill')
      .select('COUNT(bill.id)::TEXT', 'quantities')
      .addSelect('SUM(bill.amount::BIGINT)::TEXT', 'amount')
      .withDeleted()
      .where('bill.deletedAt IS NOT NULL')
      .andWhere('bill.user_id = :userId')
      .setParameters({ userId: user.id })
      .getRawOne();
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
      .where('bill.user_id = :userId')
      .orderBy('bill.createdAt', 'DESC')
      .setParameters({ userId: user.id })
      .getMany();
    if (bills.length) {
      workSheet.addRows(bills);
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
      .exe();
  }

  findByIdDeleted(id: string, user: User): Promise<Bill> {
    return this.billRepository
      .createQueryBuilder('bill')
      .withDeleted()
      .where('bill.deletedAt IS NOT NULL')
      .andWhere('bill.id = :billId')
      .andWhere('bill.user_id = :userId')
      .setParameters({ billId: id, userId: user.id })
      .getOneOrFail();
  }
}
