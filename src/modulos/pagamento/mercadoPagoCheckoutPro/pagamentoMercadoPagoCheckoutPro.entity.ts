import { Entity, PrimaryColumn } from "typeorm";

@Entity('pagamento_mercado_pago_checkout_pro')
export class PagamentoMercadoPagoCheckoutPro{
    @PrimaryColumn({type:"uuid"})
    id:string
}