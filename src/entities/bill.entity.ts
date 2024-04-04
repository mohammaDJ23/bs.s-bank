import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Bill {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 18 })
  amount: string;

  @Column({ type: 'varchar', length: 100 })
  receiver: string;

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ type: 'varchar', length: 100, array: true })
  consumers: string[];

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({
    nullable: true,
    type: 'timestamptz',
    transformer: {
      from(value) {
        return value ? new Date(value).getTime() : value;
      },
      to(value) {
        return value ? new Date(value) : value;
      },
    },
  })
  date: Date | number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.bills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
