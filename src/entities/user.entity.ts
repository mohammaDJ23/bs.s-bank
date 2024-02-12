import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Bill, Consumer, Receiver } from '../entities';
import { UserRoles } from 'src/types';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  pId: number;

  @Column({ type: 'integer', nullable: false, unique: true })
  id: number;

  @Column({ type: 'varchar', length: 45 })
  firstName: string;

  @Column({ type: 'varchar', length: 45 })
  lastName: string;

  @Column({ type: 'varchar', unique: true, length: 256 })
  email: string;

  @Column({ type: 'varchar', length: 60 })
  password: string;

  @Column({ type: 'varchar', length: 12 })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRoles,
  })
  role: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @OneToMany(() => Bill, (bill) => bill.user, { cascade: true })
  bills: Bill[];

  @OneToMany(() => Consumer, (consumer) => consumer.user, { cascade: true })
  consumers: Consumer[];

  @OneToMany(() => Receiver, (receiver) => receiver.user, { cascade: true })
  receivers: Receiver[];

  @OneToMany(() => User, (user) => user.parent)
  users: User[];

  @ManyToOne(() => User, (user) => user.users)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  parent: User;
}
