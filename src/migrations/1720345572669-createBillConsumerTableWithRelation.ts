import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillConsumerTableWithRelation1720345572669 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.bill_consumer (
        bill_id BIGINT,
        consumer_id INT,

        CONSTRAINT pk_bill_consumer PRIMARY KEY (bill_id, consumer_id),
        
        CONSTRAINT fk_bill FOREIGN KEY(bill_id) REFERENCES public.bill(id),

        CONSTRAINT fk_consumer FOREIGN KEY(consumer_id) REFERENCES public.consumer(id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.bill_consumer;');
  }
}
