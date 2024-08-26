import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProdutoEntity } from "../produto/produtos.entity";

@Entity('adicionais')
export class AdicionaisEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ProdutoEntity, (produto) => produto.adicionais)
    produto: ProdutoEntity;

    @Column()
    nome: string;

    @Column()
    valor: string;

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}