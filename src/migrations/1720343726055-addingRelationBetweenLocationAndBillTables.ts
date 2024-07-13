import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddingRelationBetweenLocationAndBillTables1720343726055 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.bill ADD COLUMN location_id INT;
      ALTER TABLE public.bill ADD CONSTRAINT fk_locaiton FOREIGN KEY(location_id) REFERENCES public.location(id);  
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE public.bill DROP COLUMN location_id;');
  }
}
