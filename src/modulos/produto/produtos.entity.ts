import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AdicionaisEntity } from "../adicional/adicionais.entity";
import { CategoriaEntity } from "../categoria/categorias.entity";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";

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

    @OneToMany(() => IngredientesEntity, (ingredientes) => ingredientes.produto)
    ingredientes: IngredientesEntity[];

    @OneToMany(() => AdicionaisEntity, (adicionais) => adicionais.produto)
    adicionais: AdicionaisEntity[];

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}