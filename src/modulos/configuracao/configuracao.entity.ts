import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('configuracaos')
export class ConfiguracaoEntity{

    @PrimaryGeneratedColumn("uuid")
    id:string

    @Column()
    chave:string

    @Column()
    valor:string

    @Column()
    privado:boolean

    @UpdateDateColumn()
    updated_at:Date
    
    @CreateDateColumn()
    created_at:Date;
}