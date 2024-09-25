import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PedidoEntity } from "./pedido.entity";
import { ProdutoEntity } from "../produto/produtos.entity";


interface Ingrediente{
    nome: string;
    quantia: number;
}

interface Adicional{
    nome: string;
    quantia: number;
    valor:number
}

@Entity('pedidos_itens')
export class PedidoItensEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => PedidoEntity, (pedido) => pedido.itens)
    pedido: PedidoEntity;

    @Column({ type: 'float' })
    valor: number;

    @Column({ type: 'json', nullable: true }) // Ingredientes como JSON
    ingredientes: Ingrediente[]; // Você pode tipar isso como quiser, por exemplo: any[] para um array

    @Column({ type: 'json', nullable: true }) // Adicionais como JSON
    adicionais: Adicional[];

    @Column({ type: 'float', default: 0 })
    valorAdicionais: number;

    @Column({ type: 'int', default: 1 })
    quantidade: number;

    @Column({ type: 'text', default: '' })
    obs: string;

    @ManyToOne(() => ProdutoEntity,(produto)=>null)
    produto:ProdutoEntity

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
