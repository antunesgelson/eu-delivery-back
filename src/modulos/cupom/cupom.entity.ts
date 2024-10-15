import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export enum TipoCupomEnum {
    PORCENTO="porcentagem",
    VALOR_FIXO="valor_fixo"
}

@Entity('cupom')
export class CupomEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string
    
    @Column({ type: 'text', default: '' })
    nome: string

    @Column({ default: '' })
    descricao: string

    @Column({type:'float', default:0})
    valor:number
    
    @Column({type:"enum",enum:TipoCupomEnum, default:TipoCupomEnum.VALOR_FIXO})
    tipo:TipoCupomEnum
    
    @Column()
    quantidade:number

    @Column({type:"date"})
    validade

    @Column({type:"bool"})
    status:boolean

    @Column({type:"float"})
    valorMinimoGasto:number

    @Column({type:"bool"})
    listaPublica // aparece na lista de todos para usar o cupom.

    @Column({type:"bool"})
    unicoUso // só pode usar  uma vez...


    @UpdateDateColumn()
    updated_at: Date

    @CreateDateColumn()
    created_at: Date

}