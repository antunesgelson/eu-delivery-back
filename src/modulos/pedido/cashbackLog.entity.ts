import { Column, CreateDateColumn, Entity, ManyToMany, ManyToOne,  PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { UsuarioEntiy } from "../usuario/usuarios.entity";
import { PedidoEntity } from "./pedido.entity";



@Entity('cashback_log')
export class CashbackLog {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => UsuarioEntiy, {eager:false})
    cliente: UsuarioEntiy;

    @ManyToOne(()=>PedidoEntity,{eager:false})
    pedido:PedidoEntity;

    @Column({type:"float"})
    valor:number;

    @UpdateDateColumn()
    updated_at: Date

    @CreateDateColumn()
    created_at: Date

}