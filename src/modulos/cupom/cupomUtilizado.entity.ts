import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export enum TipoCupomEnum {
    PORCENTO="Porcento",
    VALOR_FIXO="Valor fixo"
}

@Entity('cupom_utilizados')
export class CupomUtilizadoEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'text', default: '' })
    cupomId: string

    @Column()
    usuarioId:number

    @UpdateDateColumn()
    updated_at: Date

    @CreateDateColumn()
    created_at: Date

}