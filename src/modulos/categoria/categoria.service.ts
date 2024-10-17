import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoriaEntity } from "./categorias.entity";
import { CategoriaDTO } from "./dto/categoria.dto";
import { CategoriaEditarDTO } from "./dto/categoriaEditar.dto";
import { NotFoundError } from "rxjs";
import { bool } from "aws-sdk/clients/signer";

@Injectable()
export class CategoriaSerivice {
    constructor(@InjectRepository(CategoriaEntity)
    private categoriaRepository: Repository<CategoriaEntity>

    ) { }

    async create(categiria: CategoriaDTO) {
        const isValid = await this.categoriaRepository.findOne({ where: { titulo: categiria.titulo } });
        if (isValid) throw new ConflictException('Categoria já cadastrada.')
        const categoria = await this.categoriaRepository.save(categiria);
        return categoria;
    }

    async editar(categoriaEditarDTO:CategoriaEditarDTO){
        const categoria = await this.categoriaRepository.findOne({where:{id:categoriaEditarDTO.id}});
        if(!categoria) throw new NotFoundException('Categoria não encontrada.');
        const categoriaDuplicada = await this.categoriaRepository.findOne({where:{titulo:categoriaEditarDTO.titulo}})
        if(categoriaDuplicada && categoriaDuplicada.id != categoria.id) throw new ConflictException('Já possuí uma categoria com esse título.')
        categoria.titulo = categoriaEditarDTO.titulo;
        return this.categoriaRepository.save(categoria);
    }

    async deletar(idDelete) { 
        const categoria = await this.categoriaRepository.findOne({where:{id:idDelete}});
        if(!categoria) throw new NotFoundException('Endereço não encontrado.');
        return this.categoriaRepository.delete(idDelete);
    }

    async list(dto:{isAdmin:boolean}) {
        console.log(dto)
        if(dto.isAdmin){
            return await this.categoriaRepository.find();
        }else{
            return await this.categoriaRepository.find({where:{status:true}});
        }
        
    }

    async listDetails(dto:{isAdmin:boolean}) {
        if(dto.isAdmin){
            return await this.categoriaRepository.find({relations: ['produtos'],});
        }else{
            return await this.categoriaRepository.find({where:{status:true},relations: ['produtos'],});
        }
        
    }

}