import dataSource from './data-source';
import {
  Categoria,
  Produto,
  CatalogoVersao,
  Usuario,
  Configuracao,
} from './entities';
import { hashSenha } from '../modulos/auth/auth.service';
export async function seed() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Seed proibido em produção.');
  await dataSource.initialize();
  await dataSource.transaction(async (m) => {
    if (!(await m.findOneBy(CatalogoVersao, { id: 1 })))
      await m.save(CatalogoVersao, { id: 1, versao: 0 });
    const cats = [
      ['1', 'Assados'],
      ['2', 'Defumados BBQ'],
      ['3', 'Acompanhamentos'],
      ['4', 'Bebidas'],
    ];
    for (const [i, [id, titulo]] of cats.entries())
      if (!(await m.findOneBy(Categoria, { id })))
        await m.save(Categoria, { id, titulo, ordem: i });
    const products = [
      [101, '1', 'Frango assado recheado', 65, 12, 36],
      [102, '1', 'Frango assado sem recheio', 60, 15, 36],
      [103, '1', 'Meio frango assado', 35, 0, 0],
      [201, '2', 'Costelinha BBQ defumada', 89.9, 5, 9],
      [301, '3', 'Maionese', 18, 15, 26],
      [302, '3', 'Arroz', 15, 18, 24],
      [401, '4', 'Coca-Cola 2L', 15, 15, 18],
      [402, '4', 'Pureza 2L', 15, 12, 14],
    ];
    for (const row of products) {
      const [id, categoriaId, titulo, price, sat, sun] = row;
      if (!(await m.findOneBy(Produto, { id: Number(id) })))
        await m.save(Produto, {
          id: Number(id),
          categoriaId: String(categoriaId),
          titulo: String(titulo),
          descricao: String(titulo) + ' preparado para retirada agendada.',
          precoCentavos: Math.round(Number(price) * 100),
          imagem: '',
          estoqueSabado: Number(sat),
          estoqueDomingo: Number(sun),
          tipo: id === 103 ? 'compound' : 'simple',
          componentes: id === 103 ? [{ productId: 102, quantity: 0.5 }] : [],
          classificacoes: [],
          ingredientes: [],
          adicionais: [],
        });
    }
    for (const [chave, valor] of Object.entries({
      CASHBACK: '3',
      PEDIDOMINIMO: '35',
      INTERVALODEENTREGA: '30',
      TELEFONE: '',
      HORARIOATENDIMENTO: JSON.stringify({
        sab: { abertura: '11:30', fechamento: '14:00' },
        dom: { abertura: '11:30', fechamento: '14:00' },
      }),
    }))
      if (!(await m.findOneBy(Configuracao, { chave })))
        await m.save(Configuracao, { chave, valor });
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      if (process.env.ADMIN_PASSWORD.length < 12)
        throw new Error(
          'Senha administrativa deve ter pelo menos 12 caracteres.',
        );
      if (!(await m.findOneBy(Usuario, { email: process.env.ADMIN_EMAIL })))
        await m.save(Usuario, {
          nome: 'Administrador',
          email: process.env.ADMIN_EMAIL,
          senhaHash: hashSenha(process.env.ADMIN_PASSWORD),
          isAdmin: true,
        });
    }
  });
  await dataSource.destroy();
  process.stdout.write(
    'Dados de desenvolvimento criados sem sobrescrever registros existentes.\n',
  );
}
if (require.main === module)
  seed().catch((e) => {
    process.stderr.write(`Seed falhou: ${e.constructor.name}\n`);
    process.exitCode = 1;
  });
