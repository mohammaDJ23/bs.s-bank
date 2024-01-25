import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Bill, Consumer, Receiver, User } from '../entities';
import { AllExceptionFilter } from '../filters';
import {
  BillController,
  BillCronJobsController,
  ConsumerController,
  ReceiverController,
  UserController,
  UserMessagePatternController,
} from '../controllers';
import { JwtStrategy, CustomNamingStrategy } from '../strategies';
import { BillService, UserService, RabbitmqService, ConsumerService, ReceiverService } from 'src/services';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import {
  CreateBillTransaction,
  CreateUserTransaction,
  DeleteUserTransaction,
  RestoreUserTransaction,
  UpdateBillTransaction,
  UpdateUserTransaction,
} from 'src/transactions';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        isGlobal: true,
        store: await redisStore({
          url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
          password: process.env.REDIS_PASSWORD,
          username: 'default',
        }),
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      }),
    }),
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: process.env.NOTIFICATION_RABBITMQ_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.NOTIFICATION_RABBITMQ_QUEUE,
          queueOptions: {
            durable: true,
          },
          noAck: false,
        },
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: +process.env.DATABASE_PORT,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        namingStrategy: new CustomNamingStrategy(),
        entities: [Bill, User, Consumer, Receiver],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Bill, User, Consumer, Receiver]),
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
  ],
  controllers: [
    BillController,
    BillCronJobsController,
    UserController,
    UserMessagePatternController,
    ConsumerController,
    ReceiverController,
  ],
  providers: [
    UserService,
    BillService,
    JwtStrategy,
    RabbitmqService,
    ConsumerService,
    ReceiverService,
    CreateUserTransaction,
    UpdateUserTransaction,
    RestoreUserTransaction,
    DeleteUserTransaction,
    CreateBillTransaction,
    UpdateBillTransaction,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
