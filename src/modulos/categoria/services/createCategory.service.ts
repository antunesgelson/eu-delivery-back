import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoriaEntity } from "../categorias.entity";
import { CategoriaDTO } from "../dto/categoria.dto";

@Injectable()
export class CreateCategoryService {
    constructor(@InjectRepository(CategoriaEntity)
    private categoriaRepository: Repository<CategoriaEntity>,
    ) { }

    async exec(categiria: CategoriaDTO) {
        const isValid = await this.categoriaRepository.findOne({ where: { titulo: categiria.titulo } });
        if (isValid) return { mensagem: 'Categoria já existe.' };

        const categoria = await this.categoriaRepository.save(categiria);

        return { mensagem: 'Categoria criada com sucesso.', categoria };
    }
}