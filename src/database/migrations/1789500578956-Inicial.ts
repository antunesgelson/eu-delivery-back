import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inicial1789500578956 implements MigrationInterface {
  name = 'Inicial1789500578956';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`usuarios\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nome\` varchar(255) NOT NULL DEFAULT '', \`email\` varchar(255) NULL, \`tel\` varchar(255) NULL, \`googleId\` varchar(255) NULL, \`senhaHash\` varchar(255) NULL, \`cpf\` varchar(255) NOT NULL DEFAULT '', \`dataDeNascimento\` date NULL, \`isAdmin\` tinyint NOT NULL DEFAULT 0, \`ativo\` tinyint NOT NULL DEFAULT 1, \`cashbackCentavos\` int NOT NULL DEFAULT '0', \`pontos\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`), UNIQUE INDEX \`IDX_72d9d857ae0a11369b41eb3653\` (\`tel\`), UNIQUE INDEX \`IDX_c45fae2b8b476cd439c6ec9037\` (\`googleId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sessoes\` (\`id\` varchar(36) NOT NULL, \`usuarioId\` int NOT NULL, \`refreshHash\` varchar(64) NOT NULL, \`expiraEm\` datetime NOT NULL, \`revogadaEm\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f0d271f7ab2b9e18b04e27c874\` (\`refreshHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`desafios_acesso\` (\`id\` varchar(36) NOT NULL, \`destino\` varchar(255) NOT NULL, \`finalidade\` varchar(20) NOT NULL, \`segredoHash\` varchar(64) NOT NULL, \`tentativas\` int NOT NULL DEFAULT '0', \`expiraEm\` datetime NOT NULL, \`consumidoEm\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_80cbd0f86428ec116ba91dcbab\` (\`destino\`, \`finalidade\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`enderecos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`favorite\` tinyint NOT NULL DEFAULT 0, \`apelido\` varchar(255) NOT NULL, \`rua\` varchar(255) NOT NULL, \`bairro\` varchar(255) NOT NULL, \`cep\` varchar(8) NOT NULL, \`numero\` varchar(255) NOT NULL, \`complemento\` varchar(255) NOT NULL DEFAULT '', \`referencia\` varchar(255) NOT NULL DEFAULT '', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`catalogo_versao\` (\`id\` int NOT NULL, \`versao\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`categorias\` (\`id\` varchar(100) NOT NULL, \`titulo\` varchar(255) NOT NULL, \`badge\` varchar(255) NOT NULL DEFAULT 'Itens principais', \`campanha\` varchar(255) NOT NULL DEFAULT '', \`ativa\` tinyint NOT NULL DEFAULT 1, \`ordem\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`produtos\` (\`id\` bigint NOT NULL, \`categoriaId\` varchar(100) NOT NULL, \`titulo\` varchar(255) NOT NULL, \`descricao\` text NOT NULL, \`precoCentavos\` int NOT NULL, \`imagem\` mediumtext NOT NULL, \`porcoes\` int NOT NULL DEFAULT '1', \`classificacoes\` json NOT NULL, \`tipo\` varchar(255) NOT NULL DEFAULT 'simple', \`componentes\` json NOT NULL, \`ingredientes\` json NOT NULL, \`adicionais\` json NOT NULL, \`limite\` int NOT NULL DEFAULT '20', \`ativo\` tinyint NOT NULL DEFAULT 1, \`esgotado\` tinyint NOT NULL DEFAULT 0, \`estoqueSabado\` decimal(12,3) NOT NULL DEFAULT '0.000', \`estoqueDomingo\` decimal(12,3) NOT NULL DEFAULT '0.000', \`ordem\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`estoques_data\` (\`id\` int NOT NULL AUTO_INCREMENT, \`produtoId\` bigint NOT NULL, \`data\` date NOT NULL, \`capacidade\` decimal(12,3) NOT NULL, \`reservado\` decimal(12,3) NOT NULL DEFAULT '0.000', \`esgotado\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_82f6fa1e7620b34d171aa67797\` (\`produtoId\`, \`data\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cupons\` (\`id\` varchar(100) NOT NULL, \`nome\` varchar(60) NOT NULL, \`descricao\` varchar(255) NOT NULL DEFAULT '', \`tipo\` varchar(20) NOT NULL, \`valor\` decimal(10,2) NOT NULL, \`valorMinimoCentavos\` int NOT NULL DEFAULT '0', \`quantidade\` int NOT NULL, \`utilizados\` int NOT NULL DEFAULT '0', \`validade\` date NOT NULL, \`status\` tinyint NOT NULL DEFAULT 1, \`listaPublica\` tinyint NOT NULL DEFAULT 1, \`unicoUso\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_23f66d032d76ffba2fcc8f6088\` (\`nome\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pedidos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`status\` varchar(30) NOT NULL DEFAULT 'carrinho', \`pagamentoStatus\` varchar(20) NOT NULL DEFAULT 'pending', \`idempotencia\` varchar(100) NULL, \`requisicaoHash\` varchar(64) NULL, \`dataEntrega\` datetime NULL, \`canal\` varchar(255) NOT NULL DEFAULT 'retirada', \`formaPagamento\` varchar(255) NOT NULL DEFAULT '', \`obs\` varchar(255) NOT NULL DEFAULT '', \`endereco\` json NOT NULL, \`cupomId\` varchar(100) NULL, \`descontoCentavos\` int NOT NULL DEFAULT '0', \`cashbackCentavos\` int NOT NULL DEFAULT '0', \`cashbackGanhoCentavos\` int NOT NULL DEFAULT '0', \`subtotalCentavos\` int NOT NULL DEFAULT '0', \`totalCentavos\` int NOT NULL DEFAULT '0', \`reserva\` json NOT NULL, \`finalizadoEm\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_50c6f928d10535553ae17a2e89\` (\`dataEntrega\`, \`status\`), INDEX \`IDX_e9da2a53e41e72a1ce352624a3\` (\`usuarioId\`, \`status\`, \`created_at\`), UNIQUE INDEX \`IDX_43b2c45c4c16d161556d04fc5e\` (\`usuarioId\`, \`idempotencia\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pedidos_itens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`pedidoId\` int NOT NULL, \`produtoId\` bigint NOT NULL, \`quantidade\` int NOT NULL, \`obs\` varchar(255) NOT NULL DEFAULT '', \`precoUnitarioCentavos\` int NOT NULL, \`snapshot\` json NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cupons_utilizados\` (\`id\` int NOT NULL AUTO_INCREMENT, \`cupomId\` varchar(100) NOT NULL, \`usuarioId\` int NOT NULL, \`pedidoId\` int NOT NULL, \`cancelado\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_3d9cb86c9c324503e56c7a96ce\` (\`pedidoId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`beneficios_movimentos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`pedidoId\` int NOT NULL, \`tipo\` varchar(30) NOT NULL, \`centavos\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_34dbcc6bd36657f530237434e8\` (\`pedidoId\`, \`tipo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`fidelidade_premios\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`ciclo\` int NOT NULL, \`resgatadoEm\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_2f1a0642a98ba360b649b3dff0\` (\`usuarioId\`, \`ciclo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pagamentos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`pedidoId\` int NOT NULL, \`providerId\` varchar(255) NULL, \`preferenceId\` varchar(255) NULL, \`checkoutUrl\` varchar(255) NULL, \`status\` varchar(255) NOT NULL DEFAULT 'pending', \`totalCentavos\` int NOT NULL, \`eventoEm\` datetime NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5475d6b2e1a116cbe51950a795\` (\`providerId\`), UNIQUE INDEX \`IDX_e8c4f5ace7785fbee73279c10d\` (\`pedidoId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`configuracoes\` (\`chave\` varchar(100) NOT NULL, \`valor\` text NOT NULL, \`privado\` tinyint NOT NULL DEFAULT 0, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`chave\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`auditoria\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NULL, \`acao\` varchar(255) NOT NULL, \`recurso\` varchar(255) NOT NULL, \`dados\` json NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessoes\` ADD CONSTRAINT \`FK_53ca2cbbb24b1753961eb325d9f\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`enderecos\` ADD CONSTRAINT \`FK_3fda1857bc40b2c12b9562101ac\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`produtos\` ADD CONSTRAINT \`FK_8a509e69a8c1575d0247844daec\` FOREIGN KEY (\`categoriaId\`) REFERENCES \`categorias\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`estoques_data\` ADD CONSTRAINT \`FK_e015b77118d0734ff72afadfd5a\` FOREIGN KEY (\`produtoId\`) REFERENCES \`produtos\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos\` ADD CONSTRAINT \`FK_e60a655127c227b5e063e73165b\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos_itens\` ADD CONSTRAINT \`FK_6fb9cedd77a67c539ce5a4fa522\` FOREIGN KEY (\`pedidoId\`) REFERENCES \`pedidos\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos_itens\` ADD CONSTRAINT \`FK_ea1ffbb603769a976cec490a0f2\` FOREIGN KEY (\`produtoId\`) REFERENCES \`produtos\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cupons_utilizados\` ADD CONSTRAINT \`FK_400f17ae555bd0f6d17bcb47f21\` FOREIGN KEY (\`cupomId\`) REFERENCES \`cupons\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cupons_utilizados\` ADD CONSTRAINT \`FK_800279140502b3c339bb3577494\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cupons_utilizados\` ADD CONSTRAINT \`FK_3d9cb86c9c324503e56c7a96ce4\` FOREIGN KEY (\`pedidoId\`) REFERENCES \`pedidos\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`beneficios_movimentos\` ADD CONSTRAINT \`FK_4bfade6db0669c2bb631aeac136\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`beneficios_movimentos\` ADD CONSTRAINT \`FK_28412a7d6ec3ce87c2e87833e55\` FOREIGN KEY (\`pedidoId\`) REFERENCES \`pedidos\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`fidelidade_premios\` ADD CONSTRAINT \`FK_a2ae8d7fea33cd01c083862a32b\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pagamentos\` ADD CONSTRAINT \`FK_e8c4f5ace7785fbee73279c10d4\` FOREIGN KEY (\`pedidoId\`) REFERENCES \`pedidos\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO catalogo_versao (id,versao) VALUES (1,0)`,
    );
    await queryRunner.query(
      `ALTER TABLE estoques_data ADD CONSTRAINT estoque_nao_negativo CHECK (capacidade >= 0 AND reservado >= 0 AND reservado <= capacidade)`,
    );
    await queryRunner.query(
      `ALTER TABLE produtos ADD CONSTRAINT produto_preco_positivo CHECK (precoCentavos > 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE pedidos_itens ADD CONSTRAINT item_quantidade_positiva CHECK (quantidade > 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pagamentos\` DROP FOREIGN KEY \`FK_e8c4f5ace7785fbee73279c10d4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`fidelidade_premios\` DROP FOREIGN KEY \`FK_a2ae8d7fea33cd01c083862a32b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`beneficios_movimentos\` DROP FOREIGN KEY \`FK_28412a7d6ec3ce87c2e87833e55\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`beneficios_movimentos\` DROP FOREIGN KEY \`FK_4bfade6db0669c2bb631aeac136\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`cupons_utilizados\` DROP FOREIGN KEY \`FK_3d9cb86c9c324503e56c7a96ce4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`cupons_utilizados\` DROP FOREIGN KEY \`FK_800279140502b3c339bb3577494\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`cupons_utilizados\` DROP FOREIGN KEY \`FK_400f17ae555bd0f6d17bcb47f21\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos_itens\` DROP FOREIGN KEY \`FK_ea1ffbb603769a976cec490a0f2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos_itens\` DROP FOREIGN KEY \`FK_6fb9cedd77a67c539ce5a4fa522\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pedidos\` DROP FOREIGN KEY \`FK_e60a655127c227b5e063e73165b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`estoques_data\` DROP FOREIGN KEY \`FK_e015b77118d0734ff72afadfd5a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`produtos\` DROP FOREIGN KEY \`FK_8a509e69a8c1575d0247844daec\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`enderecos\` DROP FOREIGN KEY \`FK_3fda1857bc40b2c12b9562101ac\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessoes\` DROP FOREIGN KEY \`FK_53ca2cbbb24b1753961eb325d9f\``,
    );
    await queryRunner.query(`DROP TABLE \`auditoria\``);
    await queryRunner.query(`DROP TABLE \`configuracoes\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e8c4f5ace7785fbee73279c10d\` ON \`pagamentos\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_5475d6b2e1a116cbe51950a795\` ON \`pagamentos\``,
    );
    await queryRunner.query(`DROP TABLE \`pagamentos\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2f1a0642a98ba360b649b3dff0\` ON \`fidelidade_premios\``,
    );
    await queryRunner.query(`DROP TABLE \`fidelidade_premios\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_34dbcc6bd36657f530237434e8\` ON \`beneficios_movimentos\``,
    );
    await queryRunner.query(`DROP TABLE \`beneficios_movimentos\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_3d9cb86c9c324503e56c7a96ce\` ON \`cupons_utilizados\``,
    );
    await queryRunner.query(`DROP TABLE \`cupons_utilizados\``);
    await queryRunner.query(`DROP TABLE \`pedidos_itens\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_43b2c45c4c16d161556d04fc5e\` ON \`pedidos\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e9da2a53e41e72a1ce352624a3\` ON \`pedidos\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_50c6f928d10535553ae17a2e89\` ON \`pedidos\``,
    );
    await queryRunner.query(`DROP TABLE \`pedidos\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_23f66d032d76ffba2fcc8f6088\` ON \`cupons\``,
    );
    await queryRunner.query(`DROP TABLE \`cupons\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_82f6fa1e7620b34d171aa67797\` ON \`estoques_data\``,
    );
    await queryRunner.query(`DROP TABLE \`estoques_data\``);
    await queryRunner.query(`DROP TABLE \`produtos\``);
    await queryRunner.query(`DROP TABLE \`categorias\``);
    await queryRunner.query(`DROP TABLE \`catalogo_versao\``);
    await queryRunner.query(`DROP TABLE \`enderecos\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_80cbd0f86428ec116ba91dcbab\` ON \`desafios_acesso\``,
    );
    await queryRunner.query(`DROP TABLE \`desafios_acesso\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f0d271f7ab2b9e18b04e27c874\` ON \`sessoes\``,
    );
    await queryRunner.query(`DROP TABLE \`sessoes\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c45fae2b8b476cd439c6ec9037\` ON \`usuarios\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_72d9d857ae0a11369b41eb3653\` ON \`usuarios\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\` ON \`usuarios\``,
    );
    await queryRunner.query(`DROP TABLE \`usuarios\``);
  }
}
