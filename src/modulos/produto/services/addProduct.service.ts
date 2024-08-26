import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CategoriaEntity } from "src/modulos/categoria/categorias.entity";
import { Repository } from "typeorm";
import { ProdutoDTO } from "../dto/produto.dto";
import { ProdutoEntity } from "../produtos.entity";

@Injectable()
export class AddProductService {
    constructor(
        @InjectRepository(ProdutoEntity)
        private produtoRepository: Repository<ProdutoEntity>,
        @InjectRepository(CategoriaEntity)
        private categoriaRepository: Repository<CategoriaEntity>,
    ) { }

    async exec(produto: ProdutoDTO) {
        const categoria = await this.categoriaRepository.findOne({
            where: { id: produto.categoriaId },
        });

        if (!categoria) throw new Error('Categoria não encontrada');

        const produtoExistente = await this.produtoRepository.findOne({
            where: {
                titulo: produto.titulo,
                categoria: { id: categoria.id }
            },
            relations: ['categoria']
        });

        if (produtoExistente) {
            throw new ConflictException('Já existe um produto com esse título nesta categoria');
        }

        // Criar e salvar o novo produto
        const produtoEntity = this.produtoRepository.create(produto);
        produtoEntity.categoria = categoria// Associando a categoria ao produto
        await this.produtoRepository.save(produtoEntity);

        return { message: 'Produto cadastrado com sucesso', produto: produtoEntity };
    }
}