import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBillIdAndConsumerIdOfBillConsumer1720697166139 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO public.bill_consumer (bill_id, consumer_id)
      SELECT 
        public.bill.id AS bill_id, 
        public.consumer.id AS consumer_id
      FROM public.bill
	    LEFT JOIN public.consumer ON public.consumer.name = ANY (public.bill.consumers);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM public.bill_consumer;');
  }
}
