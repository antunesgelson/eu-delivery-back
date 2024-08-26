import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProdutoEntity } from "../produto/produtos.entity";


@Entity('categorias')
export class CategoriaEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    titulo: string;

    @OneToMany(() => ProdutoEntity, (produto) => produto.categoria)
    produtos: ProdutoEntity[];

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}