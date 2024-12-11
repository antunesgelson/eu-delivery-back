import { Module } from "@nestjs/common";
import { NotificacaoService } from "./notificacao.service";
import { NotificacaoController } from "./notificacao.controller";

@Module({
    imports:[],
    controllers:[NotificacaoController],
    providers:[NotificacaoService],
    exports:[]
})
export class NotificacaoModule{

}