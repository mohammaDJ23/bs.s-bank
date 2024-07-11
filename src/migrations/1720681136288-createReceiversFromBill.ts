import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReceiversFromBill1720681136288 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO public.receiver (name, user_id)
      SELECT receiver, user_id from public.bill;

      DELETE FROM public.receiver a
      USING public.receiver b
      WHERE 
        a.name = b.name AND 
        a.user_id = b.user_id AND 
        a.id != b.id AND 
        a.ctid > b.ctid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM public.receiver;');
  }
}
