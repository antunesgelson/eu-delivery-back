import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoriaEntity } from "./categorias.entity";
import { CategoriaDTO } from "./dto/categoria.dto";

@Injectable()
export class CategoriaSerivice {
    constructor(@InjectRepository(CategoriaEntity)
    private categoriaRepository: Repository<CategoriaEntity>

    ) { }

    async create(categiria: CategoriaDTO) {
        const isValid = await this.categoriaRepository.findOne({ where: { titulo: categiria.titulo } });
        if (isValid) return { mensagem: 'Categoria já existe.' };

        const categoria = await this.categoriaRepository.save(categiria);

        return { mensagem: 'Categoria criada com sucesso.', categoria };
    }

    async list() {
        return await this.categoriaRepository.find({
        });
    }

    async listDetails() {
        return await this.categoriaRepository.find({
            relations: ['produtos'], // Carregar os produtos relacionados
        });
    }

}