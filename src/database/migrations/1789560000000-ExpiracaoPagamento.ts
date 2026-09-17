import { MigrationInterface, QueryRunner } from 'typeorm';
export class ExpiracaoPagamento1789560000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      "ALTER TABLE pedidos ADD pagamentoExpiraEm datetime(3) NULL, ADD cancelamentoMotivo varchar(255) NOT NULL DEFAULT ''",
    );
    await q.query(
      'CREATE INDEX IDX_pedidos_expiracao ON pedidos (status, pagamentoStatus, pagamentoExpiraEm)',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP INDEX IDX_pedidos_expiracao ON pedidos');
    await q.query(
      'ALTER TABLE pedidos DROP COLUMN pagamentoExpiraEm, DROP COLUMN cancelamentoMotivo',
    );
  }
}
