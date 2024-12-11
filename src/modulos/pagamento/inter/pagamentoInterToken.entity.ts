import { Column, CreateDateColumn, Double, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

@Entity('pagamento_inter_tokens')
export class PagamentoInterTokenEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    scope!: string;

    @Column()
    token!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}