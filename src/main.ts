import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json } from 'express';
import { AppModule } from './app.module';
import { ErrosFilter } from './common/errors';
export async function configurarApp(app: any) {
  app.use(helmet());
  app.use(json({ limit: '4mb' }));
  app.enableCors({
    origin: (
      process.env.CORS_ORIGINS ?? 'http://localhost:4051,http://127.0.0.1:4051'
    ).split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ErrosFilter());
  const spec = new DocumentBuilder()
    .setTitle('Assados Zanini API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, spec));
  app.enableShutdownHooks();
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await configurarApp(app);
  await app.listen(
    Number(process.env.PORT_SERVER_WEB ?? 4052),
    process.env.HOST ?? '127.0.0.1',
  );
}
if (require.main === module)
  bootstrap().catch(() => {
    process.stderr.write(
      'Não foi possível iniciar a API. Verifique banco, migrations e variáveis de ambiente.\n',
    );
    process.exitCode = 1;
  });
