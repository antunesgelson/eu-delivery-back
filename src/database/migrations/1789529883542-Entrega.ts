import { MigrationInterface, QueryRunner } from 'typeorm';

export class Entrega1789529883542 implements MigrationInterface {
  name = 'Entrega1789529883542';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pedidos\` ADD \`taxaEntregaCentavos\` int NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos\` ADD \`pagamentosDivididos\` json NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`fidelidade_premios\` ADD \`valido\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      "INSERT IGNORE INTO configuracoes (chave,valor,privado) VALUES ('ENTREGA', ?, false)",
      [
        JSON.stringify({
          habilitada: true,
          taxa: 10,
          bairros: [],
          faixasCep: [{ inicio: '88650000', fim: '88650000' }],
        }),
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`fidelidade_premios\` DROP COLUMN \`valido\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos\` DROP COLUMN \`pagamentosDivididos\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos\` DROP COLUMN \`taxaEntregaCentavos\``,
    );
  }
}
