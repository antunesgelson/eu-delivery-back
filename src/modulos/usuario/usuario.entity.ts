import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { EnderecoEntity } from "../endereco/endereco.entity";

@Entity('usuarios')
export class UsuarioEntiy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nome: string;

    @Column({ default: '' })
    email?: string;

    @Column({ nullable: false })
    tel: string;

    @Column({ default: '' })
    cpf?: string;

    @Column({ type: 'date' })
    dataDeNascimento: Date;

    @OneToMany(() => EnderecoEntity, (endereco) => endereco.usuario)
    enderecos: EnderecoEntity[];

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}