import { MigrationInterface, QueryRunner } from 'typeorm';
export class Conciliacao1789570000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE conciliacoes (
      pedidoId int NOT NULL PRIMARY KEY,
      tentativas int NOT NULL DEFAULT 0,
      falhasConsecutivas int NOT NULL DEFAULT 0,
      proximaTentativaEm datetime(3) NOT NULL,
      ultimaTentativaEm datetime(3) NULL,
      ultimaFalhaEm datetime(3) NULL,
      ultimaFalhaCategoria varchar(40) NULL,
      ultimoSucessoEm datetime(3) NULL,
      resolvidoEm datetime(3) NULL,
      emExecucaoAte datetime(3) NULL,
      execucaoToken varchar(36) NULL,
      ultimaSolicitacaoEm datetime(3) NULL,
      INDEX IDX_conciliacao_fila (resolvidoEm, proximaTentativaEm),
      CONSTRAINT FK_conciliacao_pedido FOREIGN KEY (pedidoId) REFERENCES pedidos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(`INSERT INTO conciliacoes (pedidoId, proximaTentativaEm)
      SELECT id, pagamentoExpiraEm FROM pedidos WHERE status='analysis' AND pagamentoStatus='pending'
      AND pagamentoExpiraEm IS NOT NULL AND formaPagamento LIKE 'Pagamento online%'`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE conciliacoes');
  }
}
