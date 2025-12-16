import { DataSourceOptions, DataSource } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  username: 'postgres.litydamkdnckdzewerst',
  password: 'goflex123456',
  database: 'postgres',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
