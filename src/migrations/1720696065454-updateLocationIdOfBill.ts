import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLocationIdOfBill1720696065454 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE public.bill SET (location_id) = (
        SELECT id from public.location
        WHERE 
          public.location.name = public.bill.location AND
          public.location.user_id = public.bill.user_id
      );  
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('UPDATE public.bill SET location_id = null;');
  }
}
