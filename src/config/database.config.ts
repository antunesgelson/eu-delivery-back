import { TypeOrmModule } from "@nestjs/typeorm";



export default function databaseConfig():TypeOrmModule{
    return {
        type: 'mysql',
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        entities: [__dirname + '/../**/*.entity{.js,.ts}'],
        synchronize: true,
      }
}

