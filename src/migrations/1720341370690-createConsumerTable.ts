import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsumerTable1720341370690 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.consumer (
        id SERIAL PRIMARY KEY NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE,
        user_id INT,

        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES public.user(id) MATCH SIMPLE 
          ON UPDATE NO ACTION 
          ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.consumer;');
  }
}
