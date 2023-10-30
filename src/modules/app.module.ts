import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Bill, User } from '../entities';
import { AllExceptionFilter } from '../filters';
import {
  BillController,
  BillCronJobsController,
  UserController,
  UserMessagePatternController,
} from '../controllers';
import { JwtStrategy, CustomNamingStrategy } from '../strategies';
import { BillService, UserService, RabbitmqService } from 'src/services';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import {
  CreateUserTransaction,
  DeleteUserTransaction,
  RestoreUserTransaction,
  UpdateUserTransaction,
} from 'src/transactions';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        isGlobal: true,
        store: await redisStore({
          ttl: +process.env.REDIS_TTL,
          url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
          password: process.env.REDIS_PASSWORD,
        }),
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        ttl: +process.env.REDIS_TTL,
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
        entities: [Bill, User],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Bill, User]),
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
  controllers: [BillController, BillCronJobsController, UserController, UserMessagePatternController],
  providers: [
    UserService,
    BillService,
    JwtStrategy,
    RabbitmqService,
    CreateUserTransaction,
    UpdateUserTransaction,
    RestoreUserTransaction,
    DeleteUserTransaction,
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
