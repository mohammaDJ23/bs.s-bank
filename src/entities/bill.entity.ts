import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Location } from './location.entity';
import { Receiver } from './receiver.entity';
import { Consumer } from './consumer.entity';

@Entity()
export class Bill {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 18 })
  amount: string;

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

  @ManyToOne(() => Location, (location) => location.bills)
  @JoinColumn({ name: 'location_id', referencedColumnName: 'id' })
  location: Location;

  @ManyToOne(() => Receiver, (receiver) => receiver.bills)
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver: Receiver;

  @ManyToMany(() => Consumer, (consumer) => consumer.bills)
  @JoinTable({ name: 'bill_consumer' })
  consumers: Consumer[];
}
