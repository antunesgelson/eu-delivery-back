import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UsuarioEntiy } from '../usuario/usuario.entity';

@Entity('enderecos')
export class EnderecoEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: false })
    favorite?: boolean;

    @Column({ default: '' })
    apelido?: string;

    @Column({ default: '' })
    rua?: string;

    @Column({ default: '' })
    bairro?: string;

    @Column({ default: '' })
    cep?: string;

    @Column({ default: '' })
    numero?: string;

    @Column()
    complemento: string;

    @Column()
    referencia: string;

    @ManyToOne(() => UsuarioEntiy, (usuario) => usuario.enderecos)
    usuario: UsuarioEntiy;

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}