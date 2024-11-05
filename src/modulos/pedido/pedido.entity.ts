import { Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PedidoItensEntity } from "./pedidoItens.entity";
import { UsuarioEntiy } from "../usuario/usuarios.entity";

export enum StatusPedidoEnum {
    AGUARDANDO_PAGAMENTO = "aguardando pagamento",
    PAGO = "pago",
    EM_PREPARACAO = "em preparação",
    SAIU_PARA_ENTREGA = "saiu para entrega",
    ENTREGUE = "entregue",
    CANCELADO = "pedido cancelado",
    NO_CARRINHO = "no carrinho"
}

export enum PeriodoEntregaEnum {
    MANHA = "manhã",
    TARDE = "tarde",
    NOITE = "noite"
}

export interface enderecoPedido {
    favorite: boolean;
    apelido: string;
    rua: string;
    bairro: string;
    cep: string;
    numero: string;
    complemento: string;
    referencia: string;
}

@Entity('pedidos')
export class PedidoEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => UsuarioEntiy, (cliente) => cliente.pedidos)
    cliente: UsuarioEntiy

    @Column({ type: 'json', nullable: false, default:'{}'}) 
    endereco: enderecoPedido

    //cupom //cupom utilizado

    @Column({type:'float', default:0})
    cashBack:number

    @Column({default:null})
    cupomId:string

    @Column({type:'float', default:0})
    descontoCupom:number

    @Column({ type: "datetime",nullable: true })
    dataEntrega: Date

    @Column({type:"enum",enum:PeriodoEntregaEnum,nullable: true })
    periodoEntrega: PeriodoEntregaEnum

    @Column({ type: "enum", enum: StatusPedidoEnum, default: StatusPedidoEnum.AGUARDANDO_PAGAMENTO })
    status: StatusPedidoEnum

    @Column({ type: 'text', default: '' })
    obs: string

    @OneToMany(() => PedidoItensEntity, (itens) => itens.pedido)
    itens: PedidoItensEntity[]

    @UpdateDateColumn()
    updated_at: Date

    @CreateDateColumn()
    created_at: Date

}