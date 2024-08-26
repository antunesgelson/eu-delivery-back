import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ProdutoEntity } from "src/modulos/produto/produtos.entity";
import { Repository } from 'typeorm';
import { AdicionaisEntity } from '../adicionais.entity';
import { AdicionalDTO } from "../dto/adicional.dto";

@Injectable()
export class AddAdicionaisService {
    constructor(@InjectRepository(AdicionaisEntity)
    private adicionaisRepository: Repository<AdicionaisEntity>,
        @InjectRepository(ProdutoEntity)
        private produtoRepository: Repository<ProdutoEntity>,
    ) { }

    async exec(adicional: AdicionalDTO) {
        const produto = await this.produtoRepository.findOne({
            where: { id: adicional.produtoId },
        });

        if (!produto) throw new Error('Produto não encontrado.');

        const adicionaisExistente = await this.adicionaisRepository.findOne({
            where: {
                nome: adicional.nome,
                produto: { id: produto.id }
            },
            relations: ['produto']
        });

        if (adicionaisExistente) {
            throw new ConflictException('Já existe um adicional com esse título neste produto');
        }

        // Criar e salvar o novo produto
        const adicionaisEntity = this.adicionaisRepository.create(adicional);
        adicionaisEntity.produto = produto// Associando a categoria ao produto
        await this.adicionaisRepository.save(adicionaisEntity);

        return { message: 'Adicional cadastrado com sucesso', adicional: adicionaisEntity };
    }
}