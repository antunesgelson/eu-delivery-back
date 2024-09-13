import { ConflictException, Injectable, NotFoundException, SetMetadata } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IngredienteDTO } from './dto/ingrediente.dto';
import { IngredientesEntity } from "./ingredientes.entity";

import { IngredienteEditarDTO } from "./dto/ingredienteEditar.dto";
import { IngredienteListaByIdDTO } from "./dto/ingredienteListaById.dto";
import { IngredienteDeletarDTO } from "./dto/ingredienteDeletar.dto";
import { ProdutosIngredientesEntity } from "../produto/produtoIngrediente.entity";
import { isIn } from "class-validator";

@Injectable()
export class IngredienteService {
    constructor(@InjectRepository(IngredientesEntity)
    private ingredientesRepository: Repository<IngredientesEntity>,
        @InjectRepository(ProdutosIngredientesEntity)
        private produtoIngredienteRepository: Repository<ProdutosIngredientesEntity>,
    ) { }

    async adicionar(ingrediente: IngredienteDTO) {
        const isInvalid = await this.ingredientesRepository.findOne({ where: { nome: ingrediente.nome } });
        if (isInvalid) throw new ConflictException('Ingrediente já existe.');
        return await this.ingredientesRepository.save(ingrediente);
    }

    async listarTodos() {
        return this.ingredientesRepository.find();
    }

    async listaById(ingrediente: IngredienteListaByIdDTO) {
        return this.ingredientesRepository.findOne({ where: { id: ingrediente.id } });
    }

    async editar(ingredienteDTO: IngredienteEditarDTO) {
        const ingrediente = await this.ingredientesRepository.findOne({ where: { id: ingredienteDTO.id } });
        if (!ingrediente) throw new NotFoundException('Ingrediente não encontrado.');
        const isInvalid = await this.ingredientesRepository.findOne({ where: { nome: ingredienteDTO.nome } });
        if (isInvalid && isInvalid.id != ingrediente.id) throw new ConflictException('Ingrediente já cadastrado com esse nome.');
        Object.assign(ingrediente, ingredienteDTO);
        return this.ingredientesRepository.save(ingrediente);
    }

    async deletar(ingredienteDTO: IngredienteDeletarDTO) {
        const ingrediente = await this.ingredientesRepository.findOne({ where: { id: ingredienteDTO.id } })
        if (!ingrediente) throw new NotFoundException('Ingrediente não encontrado.')
        const associado = await this.produtoIngredienteRepository.findOne({ where: { ingrediente: { id: ingrediente.id } } })
        if (associado) throw new ConflictException('Ingrediente está associado a produtos e não pode ser deletado.');
        return this.ingredientesRepository.delete(ingrediente.id);
    }
}