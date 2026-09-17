import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
@Catch()
export class ErrosFilter implements ExceptionFilter {
  private log = new Logger('API');
  catch(error: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const requestId = randomUUID();
    const duplicado = error?.driverError?.code === 'ER_DUP_ENTRY';
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : duplicado
          ? 409
          : 500;
    const body = error instanceof HttpException ? error.getResponse() : null;
    const message =
      typeof body === 'string'
        ? body
        : ((body as any)?.message ??
          (duplicado
            ? 'Já existe um registro com esses dados.'
            : 'Não foi possível concluir a operação.'));
    if (status >= 500)
      this.log.error(
        JSON.stringify({ requestId, status, tipo: error?.constructor?.name }),
      );
    res.status(status).json({ statusCode: status, message, requestId });
  }
}
