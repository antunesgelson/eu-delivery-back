import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CategoriaEntity } from "../categoria/categorias.entity";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";
import { ProdutosIngredientesEntity } from "./produtoIngrediente.entity";
@Entity('produtos')
export class ProdutoEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CategoriaEntity, (categoria) => categoria.produtos)
    categoria: CategoriaEntity;

    @Column()
    titulo: string;

    @Column()
    descricao: string;

    @Column()
    valor: string;

    @Column()
    img: string;

    @Column()
    desconto: number;

    @Column()
    limitItens: number;

    @Column()
    servingSize: number;

    @OneToMany(() => ProdutosIngredientesEntity, (produtosIngredientes) => produtosIngredientes.produto)
    produtosIngredientes: ProdutosIngredientesEntity[];

    @ManyToMany(() => IngredientesEntity)
    @JoinTable()
    adicionais: IngredientesEntity[];

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}
