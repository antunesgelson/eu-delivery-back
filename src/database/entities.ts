import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn() id: number;
  @Column({ default: '' }) nome: string;
  @Column({ nullable: true, unique: true }) email: string;
  @Column({ nullable: true, unique: true }) tel: string;
  @Column({ nullable: true, unique: true }) googleId: string;
  @Column({ nullable: true, select: false }) senhaHash: string;
  @Column({ default: '' }) cpf: string;
  @Column({ type: 'date', nullable: true }) dataDeNascimento: string;
  @Column({ default: false }) isAdmin: boolean;
  @Column({ default: true }) ativo: boolean;
  @Column({ default: 0 }) cashbackCentavos: number;
  @Column({ default: 0 }) pontos: number;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
@Entity('sessoes')
export class Sessao {
  @PrimaryColumn({ length: 36 }) id: string;
  @Column() usuarioId: number;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
  @Column({ length: 64, unique: true }) refreshHash: string;
  @Column() expiraEm: Date;
  @Column({ nullable: true }) revogadaEm: Date;
  @CreateDateColumn() created_at: Date;
}
@Entity('desafios_acesso')
@Index(['destino', 'finalidade', 'created_at'])
export class Desafio {
  @PrimaryColumn({ length: 36 }) id: string;
  @Column({ length: 255 }) destino: string;
  @Column({ length: 20 }) finalidade: string;
  @Column({ length: 64 }) segredoHash: string;
  @Column({ default: 0 }) tentativas: number;
  @Column() expiraEm: Date;
  @Column({ nullable: true }) consumidoEm: Date;
  @CreateDateColumn() created_at: Date;
}
@Entity('enderecos')
export class Endereco {
  @PrimaryGeneratedColumn() id: number;
  @Column() usuarioId: number;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
  @Column({ default: false }) favorite: boolean;
  @Column() apelido: string;
  @Column() rua: string;
  @Column() bairro: string;
  @Column({ length: 8 }) cep: string;
  @Column() numero: string;
  @Column({ default: '' }) complemento: string;
  @Column({ default: '' }) referencia: string;
}
@Entity('catalogo_versao')
export class CatalogoVersao {
  @PrimaryColumn() id: number;
  @Column({ default: 0 }) versao: number;
}
@Entity('categorias')
export class Categoria {
  @PrimaryColumn({ length: 100 }) id: string;
  @Column() titulo: string;
  @Column({ default: 'Itens principais' }) badge: string;
  @Column({ default: '' }) campanha: string;
  @Column({ default: true }) ativa: boolean;
  @Column({ default: 0 }) ordem: number;
}
@Entity('produtos')
export class Produto {
  @PrimaryColumn({
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  id: number;
  @Column({ length: 100 }) categoriaId: string;
  @ManyToOne(() => Categoria, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoriaId' })
  categoria: Categoria;
  @Column() titulo: string;
  @Column({ type: 'text' }) descricao: string;
  @Column() precoCentavos: number;
  @Column({ type: 'mediumtext' }) imagem: string;
  @Column({ default: 1 }) porcoes: number;
  @Column({ type: 'json' }) classificacoes: string[];
  @Column({ default: 'simple' }) tipo: string;
  @Column({ type: 'json' }) componentes: Array<{
    productId: number;
    quantity: number;
  }>;
  @Column({ type: 'json' }) ingredientes: Array<{
    id: string;
    nome: string;
    valor: number;
    removivel: boolean;
    quantia: number;
  }>;
  @Column({ type: 'json' }) adicionais: Array<{
    id: string;
    nome: string;
    valor: number;
  }>;
  @Column({ default: 20 }) limite: number;
  @Column({ default: true }) ativo: boolean;
  @Column({ default: false }) esgotado: boolean;
  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  estoqueSabado: number;
  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  estoqueDomingo: number;
  @Column({ default: 0 }) ordem: number;
}
@Entity('estoques_data')
@Unique(['produtoId', 'data'])
export class Estoque {
  @PrimaryGeneratedColumn() id: number;
  @Column({
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  produtoId: number;
  @ManyToOne(() => Produto, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'produtoId' })
  produto: Produto;
  @Column({ type: 'date' }) data: string;
  @Column({ type: 'decimal', precision: 12, scale: 3 }) capacidade: number;
  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  reservado: number;
  @Column({ default: false }) esgotado: boolean;
}
@Entity('cupons')
export class Cupom {
  @PrimaryColumn({ length: 100 }) id: string;
  @Column({ unique: true, length: 60 }) nome: string;
  @Column({ default: '' }) descricao: string;
  @Column({ length: 20 }) tipo: string;
  @Column({ type: 'decimal', precision: 10, scale: 2 }) valor: number;
  @Column({ default: 0 }) valorMinimoCentavos: number;
  @Column() quantidade: number;
  @Column({ default: 0 }) utilizados: number;
  @Column({ type: 'date' }) validade: string;
  @Column({ default: true }) status: boolean;
  @Column({ default: true }) listaPublica: boolean;
  @Column({ default: false }) unicoUso: boolean;
  @Column({ default: false }) arquivado: boolean;
}
@Entity('pedidos')
@Index(['usuarioId', 'status', 'created_at'])
@Index(['dataEntrega', 'status'])
@Unique(['usuarioId', 'idempotencia'])
export class Pedido {
  @PrimaryGeneratedColumn() id: number;
  @Column() usuarioId: number;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
  @Column({ length: 30, default: 'carrinho' }) status: string;
  @Column({ length: 20, default: 'pending' }) pagamentoStatus: string;
  @Column({ length: 100, nullable: true }) idempotencia: string;
  @Column({ length: 64, nullable: true }) requisicaoHash: string;
  @Column({ nullable: true }) dataEntrega: Date;
  @Column({ default: 'retirada' }) canal: string;
  @Column({ default: '' }) formaPagamento: string;
  @Column({ default: '' }) obs: string;
  @Column({ type: 'json' }) endereco: Record<string, unknown>;
  @Column({ length: 100, nullable: true }) cupomId: string;
  @Column({ default: 0 }) descontoCentavos: number;
  @Column({ default: 0 }) cashbackCentavos: number;
  @Column({ default: 0 }) cashbackGanhoCentavos: number;
  @Column({ default: 0 }) subtotalCentavos: number;
  @Column({ default: 0 }) totalCentavos: number;
  @Column({ default: 0 }) ajusteCentavos: number;
  @Column({ default: 0 }) taxaEntregaCentavos: number;
  @Column({ type: 'json', nullable: true }) pagamentosDivididos: Array<{
    metodo: string;
    valor: number;
  }>;
  @Column({ type: 'json' }) reserva: Array<{
    produtoId: number;
    data: string;
    quantidade: number;
  }>;
  @Column({ type: 'datetime', precision: 3, nullable: true })
  pagamentoExpiraEm: Date;
  @Column({ default: '' }) cancelamentoMotivo: string;
  @Column({ nullable: true }) finalizadoEm: Date;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
@Entity('conciliacoes')
@Index(['resolvidoEm', 'proximaTentativaEm'])
export class Conciliacao {
  @PrimaryColumn() pedidoId: number;
  @ManyToOne(() => Pedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;
  @Column({ default: 0 }) tentativas: number;
  @Column({ default: 0 }) falhasConsecutivas: number;
  @Column({ type: 'datetime', precision: 3 }) proximaTentativaEm: Date;
  @Column({ type: 'datetime', precision: 3, nullable: true })
  ultimaTentativaEm: Date;
  @Column({ type: 'datetime', precision: 3, nullable: true })
  ultimaFalhaEm: Date;
  @Column({ length: 40, nullable: true }) ultimaFalhaCategoria: string;
  @Column({ type: 'datetime', precision: 3, nullable: true })
  ultimoSucessoEm: Date;
  @Column({ type: 'datetime', precision: 3, nullable: true }) resolvidoEm: Date;
  @Column({ type: 'datetime', precision: 3, nullable: true })
  emExecucaoAte: Date;
  @Column({ length: 36, nullable: true }) execucaoToken: string;
  @Column({ type: 'datetime', precision: 3, nullable: true })
  ultimaSolicitacaoEm: Date;
}
@Entity('pedidos_itens')
export class PedidoItem {
  @PrimaryGeneratedColumn() id: number;
  @Column() pedidoId: number;
  @ManyToOne(() => Pedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;
  @Column({
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  produtoId: number;
  @ManyToOne(() => Produto, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'produtoId' })
  produto: Produto;
  @Column() quantidade: number;
  @Column({ default: '' }) obs: string;
  @Column() precoUnitarioCentavos: number;
  @Column({ type: 'json' }) snapshot: Record<string, any>;
}
@Entity('cupons_utilizados')
@Unique(['pedidoId'])
export class CupomUso {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 100 }) cupomId: string;
  @ManyToOne(() => Cupom, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cupomId' })
  cupom: Cupom;
  @Column() usuarioId: number;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
  @Column() pedidoId: number;
  @ManyToOne(() => Pedido, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;
  @Column({ default: false }) cancelado: boolean;
}
@Entity('beneficios_movimentos')
@Unique(['pedidoId', 'tipo'])
export class BeneficioMovimento {
  @PrimaryGeneratedColumn() id: number;
  @Column() usuarioId: number;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
  @Column() pedidoId: number;
  @ManyToOne(() => Pedido, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;
  @Column({ length: 30 }) tipo: string;
  @Column() centavos: number;
  @CreateDateColumn() created_at: Date;
}
@Entity('fidelidade_premios')
@Unique(['usuarioId', 'ciclo'])
export class Premio {
  @PrimaryGeneratedColumn() id: number;
  @Column() usuarioId: number;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
  @Column() ciclo: number;
  @Column({ nullable: true }) resgatadoEm: Date;
  @Column({ default: true }) valido: boolean;
  @CreateDateColumn() created_at: Date;
}
@Entity('pagamentos')
@Unique(['pedidoId'])
export class Pagamento {
  @PrimaryGeneratedColumn() id: number;
  @Column() pedidoId: number;
  @ManyToOne(() => Pedido, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;
  @Column({ nullable: true, unique: true }) providerId: string;
  @Column({ nullable: true }) preferenceId: string;
  @Column({ nullable: true }) checkoutUrl: string;
  @Column({ default: 'pending' }) status: string;
  @Column() totalCentavos: number;
  @Column({ nullable: true }) eventoEm: Date;
  @UpdateDateColumn() updated_at: Date;
}
@Entity('configuracoes')
export class Configuracao {
  @PrimaryColumn({ length: 100 }) chave: string;
  @Column({ type: 'text' }) valor: string;
  @Column({ default: false }) privado: boolean;
  @UpdateDateColumn() updated_at: Date;
  @CreateDateColumn() created_at: Date;
}
@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) usuarioId: number;
  @Column() acao: string;
  @Column() recurso: string;
  @Column({ type: 'json' }) dados: Record<string, unknown>;
  @CreateDateColumn() created_at: Date;
}
@Entity('pdv_rascunhos')
export class PdvRascunho {
  @PrimaryGeneratedColumn() id: number;
  @Column() usuarioId: number;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
  @Column({ type: 'json' }) dados: Record<string, unknown>;
  @UpdateDateColumn() updated_at: Date;
}
export const entidades = [
  Usuario,
  Sessao,
  Desafio,
  Endereco,
  CatalogoVersao,
  Categoria,
  Produto,
  Estoque,
  Cupom,
  Pedido,
  PedidoItem,
  Conciliacao,
  CupomUso,
  BeneficioMovimento,
  Premio,
  Pagamento,
  Configuracao,
  Auditoria,
  PdvRascunho,
];
