import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriaController } from "./categoria.controller";
import { CategoriaSerivice } from "./categoria.service";
import { CategoriaEntity } from "./categorias.entity";


@Module({
    imports: [TypeOrmModule.forFeature([CategoriaEntity])],
    controllers: [CategoriaController],
    providers: [
        CategoriaSerivice
    ]
})
export class CategoriaModule {

}