import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProdutoEntity } from "../produto/produto.entity";

@Entity('ingredientes')
export class IngredientesEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ProdutoEntity, (produto) => produto.ingredientes)
    produto: ProdutoEntity;

    @Column()
    nome: string;

    @Column()
    valor: string;

    @Column()
    removivel: boolean;

    @Column()
    quantia: number;

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}