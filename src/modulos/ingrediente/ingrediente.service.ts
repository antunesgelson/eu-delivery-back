import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IngredienteDTO } from './dto/ingrediente.dto';
import { IngredientesEntity } from "./ingredientes.entity";

@Injectable()
export class IngredienteService {
    constructor(@InjectRepository(IngredientesEntity)
    private ingredientesRepository: Repository<IngredientesEntity>
    ) { }

    async create(ingrediente: IngredienteDTO) {
        const isValid = await this.ingredientesRepository.findOne({ where: { nome: ingrediente.nome } });
        if (isValid) return { mensagem: 'Ingrediente já existe.' };

        const ingredienteEntity = this.ingredientesRepository.create(ingrediente);
        await this.ingredientesRepository.save(ingredienteEntity);

        return { mensagem: 'Ingrediente criado com sucesso.', ingrediente: ingredienteEntity };
    }
}