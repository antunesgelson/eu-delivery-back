import { MigrationInterface, QueryRunner } from 'typeorm';

export class Operacao1789501637703 implements MigrationInterface {
  name = 'Operacao1789501637703';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`pdv_rascunhos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`dados\` json NOT NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cupons\` ADD \`arquivado\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos\` ADD \`ajusteCentavos\` int NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pdv_rascunhos\` ADD CONSTRAINT \`FK_f9ba1ebac4a8d78dd7e4a3f9529\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pdv_rascunhos\` DROP FOREIGN KEY \`FK_f9ba1ebac4a8d78dd7e4a3f9529\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos\` DROP COLUMN \`ajusteCentavos\``,
    );
    await queryRunner.query(`ALTER TABLE \`cupons\` DROP COLUMN \`arquivado\``);
    await queryRunner.query(`DROP TABLE \`pdv_rascunhos\``);
  }
}
