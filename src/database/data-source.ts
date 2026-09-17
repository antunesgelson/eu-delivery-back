import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { entidades } from './entities';
export const opcoesBanco = () => ({
  type: 'mysql' as const,
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  entities: entidades,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: false,
  timezone: 'Z',
  charset: 'utf8mb4',
  logging: false as const,
});
export default new DataSource(opcoesBanco());
