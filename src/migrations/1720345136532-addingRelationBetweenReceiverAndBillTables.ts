import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddingRelationBetweenReceiverAndBillTables1720345136532 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.bill ADD COLUMN receiver_id INT;
      ALTER TABLE public.bill ADD CONSTRAINT fk_receiver FOREIGN KEY(receiver_id) REFERENCES public.receiver(id);  
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE public.bill DROP COLUMN receiver_id;');
  }
}
