import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, //transforma os dados para o tipo que está no DTO
      whitelist: true, //ignora todas as propriedades que não estão no DTO
      forbidNonWhitelisted: true, //retorna um erro se tiver propriedades que não estão no DTO
    })
  )

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(5000);
}
bootstrap();
