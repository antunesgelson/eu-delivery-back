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

    // Definindo o campo 'img' como JSON
    @Column({type:"json"})
    imgs: {
        ETag:string,
        Bucket: string,
        Body: Express.Multer.File,
        Key: string
      }[]=[]; 

    @Column()
    desconto: number;

    @Column()
    limitItens: number;

    @Column()
    servingSize: number;

    @OneToMany(() => ProdutosIngredientesEntity, (produtosIngredientes) => produtosIngredientes.produto)
    produtosIngredientes: ProdutosIngredientesEntity[];

    @ManyToMany(() => IngredientesEntity, { cascade: ['insert', 'update'] })
    @JoinTable()
    adicionais: IngredientesEntity[];

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}
