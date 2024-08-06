import { Module } from '@nestjs/common';
import { IsUniqueValidator } from './validator/isUnique.validator';



@Module({
    controllers: [],
    imports: [], // Se necessário
    providers: [IsUniqueValidator],
    exports: [IsUniqueValidator] // Exporte o validador
})
export class SharedModule { }



