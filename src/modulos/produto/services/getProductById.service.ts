import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProdutoEntity } from "../produtos.entity";

@Injectable()
export class GetProductByIdService {
    constructor(
        @InjectRepository(ProdutoEntity)
        private produtoRepository: Repository<ProdutoEntity>,
    ) { }

    async exec(produtoId: number) {
        const produto = await this.produtoRepository.findOne({
            where: { id: produtoId },
            relations: ['ingredientes', 'adicionais'], // Carregar as relações de ingredientes e adicionais
        });

        if (!produto) {
            throw new NotFoundException(`Produto com ID ${produtoId} não encontrado.`);
        }

        return produto;
    }
}
