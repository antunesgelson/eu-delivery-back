import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default function databaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT), // Certifique-se de que o valor do port é numérico
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    entities: [__dirname + '/../**/*.entity{.js,.ts}'],
    synchronize: false,
    timezone: '-03:00', // Definindo o fuso horário de São Paulo
  };
}
