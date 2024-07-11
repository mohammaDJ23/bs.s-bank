import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReceiverIdOfBill1720696814139 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE public.bill SET (receiver_id) = (
        SELECT id from public.receiver
        WHERE 
          public.receiver.name = public.bill.receiver AND
          public.receiver.user_id = public.bill.user_id
      );  
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('UPDATE public.bill SET receiver_id = null;');
  }
}
