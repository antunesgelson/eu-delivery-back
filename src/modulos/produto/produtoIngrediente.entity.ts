import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";
import { ProdutoEntity } from "./produtos.entity";

@Entity('produtos_ingredientes')
export class ProdutosIngredientesEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ProdutoEntity, (produto) => produto.produtosIngredientes, { onDelete: 'CASCADE' })
    produto: ProdutoEntity;

    @ManyToOne(() => IngredientesEntity, (ingrediente) => ingrediente.produtosIngredientes)
    ingrediente: IngredientesEntity;

    @Column()
    quantia: number;

    @Column()
    removivel: boolean;
}
