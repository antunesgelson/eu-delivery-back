import { Expose, Transform, Type } from 'class-transformer';
import * as moment from 'moment-timezone';
import { PedidoItensEntity } from '../pedidoItens.entity';
import { StatusPedidoEnum } from '../pedido.entity';

export class PedidoDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => PedidoItensEntity)
  itens: PedidoItensEntity[];

  @Expose()
  clienteId: number;  // Mapeia o ID do cliente

  @Expose()
  endereco: {
    favorite: boolean;
    apelido: string;
    rua: string;
    bairro: string;
    cep: string;
    numero: string;
    complemento: string;
    referencia: string;
  };

  @Expose()
  cashBack: number;

  @Expose()
  status: StatusPedidoEnum;

  @Expose()
  obs: string;

  @Expose()
  @Transform(({ value }) => moment(value).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss'))
  dataEntrega: string;

  @Expose()
  @Transform(({ value }) => moment(value).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss'))
  created_at: string;

  @Expose()
  @Transform(({ value }) => moment(value).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss'))
  updated_at: string;
}
