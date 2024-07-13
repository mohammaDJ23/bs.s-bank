import { DataSource } from 'typeorm';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';
import { CreateLocationTable1720338313245 } from '../migrations/1720338313245-createLocationTable';
import { CreateReceiverTable1720341097324 } from '../migrations/1720341097324-createReceiverTable';
import { CreateConsumerTable1720341370690 } from '../migrations/1720341370690-createConsumerTable';
import { CreateBillConsumerTableWithRelation1720345572669 } from '../migrations/1720345572669-createBillConsumerTableWithRelation';
import { AddingRelationBetweenLocationAndBillTables1720343726055 } from '../migrations/1720343726055-addingRelationBetweenLocationAndBillTables';
import { AddingRelationBetweenReceiverAndBillTables1720345136532 } from '../migrations/1720345136532-addingRelationBetweenReceiverAndBillTables';
import { CreateReceiversFromBill1720681136288 } from '../migrations/1720681136288-createReceiversFromBill';
import { CreateLocationsFromBill1720693892910 } from '../migrations/1720693892910-createLocationsFromBill';
import { CreateConsumersFromBill1720695394583 } from '../migrations/1720695394583-createConsumersFromBill';
import { UpdateLocationIdOfBill1720696065454 } from '../migrations/1720696065454-updateLocationIdOfBill';
import { UpdateReceiverIdOfBill1720696814139 } from '../migrations/1720696814139-updateReceiverIdOfBill';
import { UpdateBillIdAndConsumerIdOfBillConsumer1720697166139 } from '../migrations/1720697166139-updateBillIdAndConsumerIdOfBillConsumer';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: +process.env.DATABASE_PORT,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  migrationsTableName: 'migrations',
  entities: ['src/entities/*{.ts}'],
  migrations: [
    CreateLocationTable1720338313245,
    CreateReceiverTable1720341097324,
    CreateConsumerTable1720341370690,
    CreateBillConsumerTableWithRelation1720345572669,
    AddingRelationBetweenLocationAndBillTables1720343726055,
    AddingRelationBetweenReceiverAndBillTables1720345136532,
    CreateReceiversFromBill1720681136288,
    CreateLocationsFromBill1720693892910,
    CreateConsumersFromBill1720695394583,
    UpdateLocationIdOfBill1720696065454,
    UpdateReceiverIdOfBill1720696814139,
    UpdateBillIdAndConsumerIdOfBillConsumer1720697166139,
  ],
};

console.log(dataSourceOptions);

export default new DataSource(dataSourceOptions);
