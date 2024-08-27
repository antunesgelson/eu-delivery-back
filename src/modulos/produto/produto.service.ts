import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from 'typeorm';
import { CategoriaEntity } from '../categoria/categorias.entity';
import { IngredientesEntity } from '../ingrediente/ingredientes.entity';
import { AddProductIngrentDTO } from "./dto/addProductIngredient.dto";
import { ProdutoDTO } from './dto/produto.dto';
import { ProdutosIngredientesEntity } from "./produtoIngrediente.entity";
import { ProdutoEntity } from "./produtos.entity";

@Injectable()
export class ProdutoService {
    constructor(
        @InjectRepository(ProdutoEntity)
        private produtoRepository: Repository<ProdutoEntity>,
        @InjectRepository(CategoriaEntity)
        private categoriaRepository: Repository<CategoriaEntity>,
        @InjectRepository(ProdutosIngredientesEntity)
        private produtoIngredienteRepository: Repository<ProdutosIngredientesEntity>,
        @InjectRepository(IngredientesEntity)
        private ingredienteRepository: Repository<IngredientesEntity>,
    ) { }


    async create(produto: ProdutoDTO) { // Cria um novo produto
        const categoria = await this.categoriaRepository.findOne({ where: { id: produto.categoriaId }, });
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








    async listById(produtoId: number) { // Lista um produto pelo ID
        const produto = await this.produtoRepository.findOne({
            where: { id: produtoId },
            relations: ['ingredientes'], // Carregar as relações de ingredientes
        });

        if (!produto) {
            throw new NotFoundException(`Produto com ID ${produtoId} não encontrado.`);
        }

        return produto;
    }






    async addIngredient(produto: AddProductIngrentDTO) { // Adiciona um ingrediente a um produto
        const produtoEntity = await this.produtoRepository.findOne({
            where: { id: produto.produtoId },
            // relations: ['produtosIngredientes'], // Carregar as relações de ingredientes
        });

        if (!produtoEntity) throw new NotFoundException(`Produto com ID ${produto.produtoId} não encontrado.`);

        const ingredienteEntity = await this.ingredienteRepository.findOne({
            where: { id: produto.ingredienteId },
        });

        if (!ingredienteEntity) throw new NotFoundException(`Ingrediente com ID ${produto.ingredienteId} não encontrado.`);

        const IsInvalid = await this.produtoIngredienteRepository.findOne({ where: { produto: { id: produtoEntity.id }, ingrediente: { id: ingredienteEntity.id } } });
        if (IsInvalid) throw new ConflictException('Ingrediente já cadastrado.');

        await this.produtoIngredienteRepository.save({ id: null, produto: produtoEntity, ingrediente: ingredienteEntity, quantia: produto.quantia, removivel: produto.removivel });
        return { message: 'Ingrediente adicionado ao produto com sucesso.', produto: produtoEntity };
    }

}