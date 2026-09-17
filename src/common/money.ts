import { BadRequestException } from '@nestjs/common';
export function centavos(valor: number) {
  if (!Number.isFinite(valor) || valor < 0 || valor > 1000000)
    throw new BadRequestException('Valor monetário inválido.');
  return Math.round((valor + Number.EPSILON) * 100);
}
export function dataLoja(data = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
}
