import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { StatusPedidoEnum } from "../pedido/pedido.entity";

enum statusPagamento {
    APROVADO="APROVADO",
    PENDENTE="PENDENTE",
    CANCELADO="CANCELADO"
}

@Entity('pagamentos')
export class PagamentoEntity{
    //id interno do pagamento
    @PrimaryGeneratedColumn()
    id:string;

    //id da transação criada pelo gateway de pagamento
    @Column()
    transactionId:string;

    //valor totoal da transação
    @Column()
    valorPago:number;

    //taxa cobrada pelo gateway de pagamento.
    @Column()
    taxa:number;

    //status do pagamento aprovado/pendente/cancelado/
    @Column({type:"enum",enum:statusPagamento,default:statusPagamento.PENDENTE})
    status:statusPagamento;

    //referencia ao pedido/produto ou qualquer identificador interno.
    @Column()
    referenciaId:string;

    //Esse campo se refere aos logs das transações, cada vez que o status muda deve ser salvo um novo objeto dentro do log
    // o objeto pode ter o proprio objeto recebido pelo gatway.
    @Column({type:"text",default:"[]"})
    log:string;

    @UpdateDateColumn()
    updated_at:Date;

    @CreateDateColumn()
    created_at:Date;

}