import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { EnderecoEntity } from "../endereco/endereco.entity";
import { PedidoEntity } from "../pedido/pedido.entity";

@Entity('usuarios')
export class UsuarioEntiy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nome: string;

    @Column({ default: '' })
    email?: string;

    @Column({ nullable: false })
    tel: string;

    @Column({ default: '' })
    cpf?: string;

    @Column({ type: 'date' })
    dataDeNascimento: Date;

    @Column({ type: 'boolean', default: false })
    isAdmin: boolean;

    @OneToMany(() => EnderecoEntity, (endereco) => endereco.usuario)
    enderecos: EnderecoEntity[];

    @OneToMany(()=>PedidoEntity,(pedidos)=>pedidos.cliente)
    pedidos:PedidoEntity[]

    @Column({type:"float",default:0.00})
    cashback:number;
    
    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}