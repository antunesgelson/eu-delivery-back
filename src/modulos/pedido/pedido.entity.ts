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

interface enderecoPedido {
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
    id: string

    @ManyToOne(() => UsuarioEntiy, (cliente) => cliente.pedidos)
    cliente: UsuarioEntiy

    @Column({ type: "json", nullable: true })
    endereco: enderecoPedido

    //cupom //cupom utilizado

    @Column({type:'float'})
    cashBack:number

    @Column({ type: "timestamp" })
    dataEntrega: Date

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