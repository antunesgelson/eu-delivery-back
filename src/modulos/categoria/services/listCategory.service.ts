import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoriaEntity } from "../categorias.entity";

@Injectable()
export class ListCategoryService {
    constructor(
        @InjectRepository(CategoriaEntity)
        private categoriaRepository: Repository<CategoriaEntity>,
    ) { }

    async exec() {
        return await this.categoriaRepository.find({
            relations: ['produtos'], // Carregar os produtos relacionados
        });
    }
}
