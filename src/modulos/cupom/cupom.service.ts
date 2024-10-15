import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { CupomEntity, TipoCupomEnum } from "./cupom.entity";
import { Like, Repository } from "typeorm";
import { BuscarCupomPorIdDTO } from "./dto/buscarCupomPorId.dto";
import { BuscarCupomFiltroAvancado } from "./dto/buscarCupomFiltroAvancado.dto";
import { EditarCupomDTO } from "./dto/editarCupom.dto";
import { AdicionarCupomDTO } from "./dto/adiconarCupom.dto";

@Injectable()
export class CupomService {

    constructor(@InjectRepository(CupomEntity) private cupomRepository: Repository<CupomEntity>) { }

    async cadastrarCupom(cupom: AdicionarCupomDTO) {
        const isExisteCupom = await this.cupomRepository.findOne({ where: { nome: cupom.nome } });
        if (isExisteCupom) throw new ConflictException('Já existe um cupom cadastrado com esse nome.')
        if (cupom.tipo == TipoCupomEnum.PORCENTO) {
            if (cupom.valor >= 99) throw new ConflictException('Cupom não pode ter um desconto maior que 99%')
            if (cupom.valor <= 0) throw new ConflictException('Cupom não pode ter um desconto menor ou igual a 0.')
        }
        if (cupom.validade) {
            const dataHoje = new Date();
            const data_hoje_comparar = new Date(dataHoje.getFullYear(), dataHoje.getUTCMonth(), dataHoje.getDate())
            const data_escolhida = new Date(parseInt(cupom.validade.toString().split('-')[0]), parseInt(cupom.validade.toString().split('-')[1]) - 1, parseInt(cupom.validade.toString().split('-')[2]))
            if (data_escolhida <= data_hoje_comparar) throw new ConflictException('A validade do cupom não pode ser menor ou igual ao dia de hoje.')

        }
        return this.cupomRepository.save(cupom)
    }

    async buscarCuporPorId(dto: BuscarCupomPorIdDTO) {
        const cupom = await this.cupomRepository.findOne({ where: { id: dto.cupomId } })
        if (!cupom) throw new NotFoundException('Cupom não encontrado.')
        return cupom;
    }

    async buscarCupomFiltroAvancado(dto: BuscarCupomFiltroAvancado) {
        let where: any;
        where = {};
        if ('publico' in dto) { where.listaPublica = dto.publico };
        if ('status' in dto) { where.status = dto.status };
        if ('nome' in dto) { where.nome = Like('%' + dto.nome + '%') };
        return this.cupomRepository.find({ where: where });
    }


    async editarCupom(dto: EditarCupomDTO) {
        const cupom = await this.cupomRepository.findOne({ where: { id: dto.id } });
        if (!cupom) throw new NotFoundException('Cupom não encontrado.')
        const isExisteCupom = await this.cupomRepository.findOne({ where: { nome: dto.nome } });
        if (isExisteCupom && isExisteCupom.id != dto.id) throw new ConflictException('Já existe um cupom cadastrado com esse nome.')
        if (dto.tipo == TipoCupomEnum.PORCENTO) {
            if (dto.valor >= 99) throw new ConflictException('Cupom não pode ter um desconto maior que 99%')
            if (dto.valor <= 0) throw new ConflictException('Cupom não pode ter um desconto menor ou igual a 0.')
        }
        if (dto.validade) {
            const dataHoje = new Date();
            const data_hoje_comparar = new Date(dataHoje.getFullYear(), dataHoje.getUTCMonth(), dataHoje.getDate())
            const data_escolhida = new Date(parseInt(dto.validade.toString().split('-')[0]), parseInt(dto.validade.toString().split('-')[1]) - 1, parseInt(dto.validade.toString().split('-')[2]))
            if (data_escolhida <= data_hoje_comparar) throw new ConflictException('A validade do cupom não pode ser menor ou igual ao dia de hoje.')
        }
        Object.assign(cupom, dto)
        return this.cupomRepository.save(cupom)
    }


}