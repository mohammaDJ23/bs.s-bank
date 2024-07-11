import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationsFromBill1720693892910 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO public.location (name, user_id)
      SELECT location, user_id from public.bill;

      DELETE FROM public.location a
      USING public.location b
      WHERE 
        a.name = b.name AND 
        a.user_id = b.user_id AND 
        a.id != b.id AND 
        a.ctid > b.ctid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM public.location;');
  }
}
