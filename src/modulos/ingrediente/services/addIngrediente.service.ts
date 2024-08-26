import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ProdutoEntity } from "src/modulos/produto/produtos.entity";
import { Repository } from "typeorm";
import { IngredienteDTO } from "../dto/ingrediente.dto";
import { IngredientesEntity } from "../ingredientes.entity";

@Injectable()
export class AddIngredienteService {
    constructor(@InjectRepository(IngredientesEntity)
    private ingredientesRepository: Repository<IngredientesEntity>,
        @InjectRepository(ProdutoEntity)
        private produtoRepository: Repository<ProdutoEntity>,
    ) { }

    async exec(ingrediente: IngredienteDTO) {
        const produto = await this.produtoRepository.findOne({
            where: { id: ingrediente.produtoId },
        });

        if (!produto) throw new Error('Produto não encontrado.');

        const ingredienteExistente = await this.ingredientesRepository.findOne({
            where: {
                nome: ingrediente.nome,
                produto: { id: produto.id }
            },
            relations: ['produto']
        });

        if (ingredienteExistente) {
            throw new ConflictException('Já existe um ingrediente com esse título neste produto');
        }

        // Criar e salvar o novo produto
        const ingredienteEntity = this.ingredientesRepository.create(ingrediente);
        ingredienteEntity.produto = produto// Associando a categoria ao produto
        await this.ingredientesRepository.save(ingredienteEntity);

        return { message: 'Ingrediente cadastrado com sucesso', ingrediente: ingredienteEntity };
    }
}