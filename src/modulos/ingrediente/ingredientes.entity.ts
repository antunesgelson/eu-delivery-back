import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProdutosIngredientesEntity } from "../produto/produtoIngrediente.entity";

@Entity('ingredientes')
export class IngredientesEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nome: string;

    @Column()
    valor: number;

    @OneToMany(() => ProdutosIngredientesEntity, (produtosIngredientes) => produtosIngredientes.ingrediente)
    produtosIngredientes: ProdutosIngredientesEntity[];

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}
