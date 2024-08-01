import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('codigos_wp')
export class CodigoWpEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    codigo: number;

    @Column()
    telefone: string;

    @Column({ type: 'timestamp' })
    validade: Date;

    @Column({ default: false })
    isValid: boolean;

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;

}