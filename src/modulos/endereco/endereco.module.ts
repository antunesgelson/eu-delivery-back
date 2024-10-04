import { Module } from "@nestjs/common";
import { EnderecoController } from "./endereco.controller";
import { EnderecoService } from "./endereco.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EnderecoEntity } from "./endereco.entity";

@Module({
    imports:[TypeOrmModule.forFeature([EnderecoEntity])],
    controllers:[EnderecoController],
    providers:[EnderecoService],
    exports:[EnderecoService]
})
export class EnderecoModule{

}