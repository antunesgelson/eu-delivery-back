import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfiguracaoDTO } from "./dto/configuracao.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfiguracaoEntity } from "./configuracao.entity";
import { Repository } from "typeorm";

@Injectable()
export class ConfiguracaoService {

    constructor(
        @InjectRepository(ConfiguracaoEntity) private configuracaoRepository: Repository<ConfiguracaoEntity>
    ) { }

    async editarOuCriarConfig(dto: ConfiguracaoDTO) {
        dto.chave = dto.chave.toUpperCase();
        const config = await this.configuracaoRepository.findOne({ where: { chave: dto.chave } })
        if (config) {
            Object.assign(config, dto)
            return this.configuracaoRepository.save(config);
        }
        return this.configuracaoRepository.save(dto);
    }

    async setConfig(dto: ConfiguracaoDTO) {
        dto.chave = dto.chave.toUpperCase();
        const isExist = await this.configuracaoRepository.findOne({ where: { chave: dto.chave } })
        if (isExist) throw new ConflictException('Chave já cadastrada');
        return this.configuracaoRepository.save(dto);
    }

    async editConfig(dto: ConfiguracaoDTO) {
        dto.chave = dto.chave.toUpperCase();
        const config = await this.configuracaoRepository.findOne({ where: { chave: dto.chave } })
        if (!config) throw new NotFoundException('Chave não encontrada.');
        Object.assign(config, dto)
        return this.configuracaoRepository.save(config);
    }

    async getConfig(dto: { chave: string, isAdmin: boolean }) {
        dto.chave = dto.chave.toUpperCase();
        let where: any
        where = {};
        where.chave = dto.chave;
        if (!dto.isAdmin) where.privado = false
        const config = await this.configuracaoRepository.findOne({ where: where })
        if (!config) throw new NotFoundException('Configuração não encontrada.')
        return config;
    }


    async getAllConfig(dto: { isAdmin: boolean }) {
        let where: any
        where = {};
        if (!dto.isAdmin) where.privado = false
        const config = await this.configuracaoRepository.find({ where: where })
        return config;
    }


}