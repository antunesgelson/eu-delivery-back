import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriaController } from "./categoria.controller";
import { CategoriaEntity } from "./categorias.entity";
import { CreateCategoryService } from "./services/createCategory.service";
import { ListCategoryService } from "./services/listCategory.service";


@Module({
    imports: [TypeOrmModule.forFeature([CategoriaEntity])],
    controllers: [CategoriaController],
    providers: [
        CreateCategoryService,
        ListCategoryService,
    ]
})
export class CategoriaModule {

}