import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsumersFromBill1720695394583 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO public.consumer (name, user_id)
      SELECT unnest(ARRAY[consumers]) as consumer, user_id from public.bill;

      DELETE FROM public.consumer a
      USING public.consumer b
      WHERE 
        a.name = b.name AND 
        a.user_id = b.user_id AND 
        a.id != b.id AND 
        a.ctid > b.ctid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM public.consumer;');
  }
}
