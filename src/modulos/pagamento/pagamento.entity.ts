import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


export enum statusPagamento {
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
    @Column({type:"float"})
    valor:number;

    //taxa cobrada pelo gateway de pagamento.
    @Column()
    taxa:number;

    //status do pagamento aprovado/pendente/cancelado/
    @Column({type:"enum",enum:statusPagamento,default:statusPagamento.PENDENTE})
    status:statusPagamento;

    //referencia ao pedido/produto ou qualquer identificador interno.
    @Column()
    referenciaId:string;

    //adicionar metadados, como email, cpf.. entre outros.. 
    @Column({type:"text", default:"{}"})
    metadados:string

    //Esse campo se refere aos logs das transações, cada vez que o status muda deve ser salvo um novo objeto dentro do log
    // o objeto pode ter o proprio objeto recebido pelo gatway.
    @Column({type:"text",default:"[]"})
    logs:string;

    @UpdateDateColumn()
    updated_at:Date;

    @CreateDateColumn()
    created_at:Date;

}