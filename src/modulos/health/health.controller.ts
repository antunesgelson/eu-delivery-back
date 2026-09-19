import { Controller, Get, Header, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import { Publico } from '../../common/security';

@Publico()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly db: DataSource) {}

  @Get('live')
  @Header('Cache-Control', 'no-store')
  ativo() {
    return { status: 'ok' };
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async pronto(@Res({ passthrough: true }) response: Response) {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        (async () => {
          await this.db.query('SELECT 1');
          if (await this.db.showMigrations())
            throw new Error('Migration pendente');
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Timeout')), 2000);
        }),
      ]);
      return { status: 'ok' };
    } catch {
      // Sondas públicas não retornam dados do banco, SQL ou credenciais.
      response.status(503);
      return { status: 'unavailable' };
    } finally {
      clearTimeout(timer);
    }
  }
}
