import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  Auditoria,
  CatalogoVersao,
  Categoria,
  Estoque,
  Produto,
} from '../../database/entities';
import { centavos } from '../../common/money';
import { SalvarCatalogoDto } from './catalogo.dto';
@Injectable()
export class CatalogoService {
  constructor(private db: DataSource) {}
  async bloquear(m: EntityManager) {
    return m
      .getRepository(CatalogoVersao)
      .createQueryBuilder('v')
      .where('v.id=1')
      .setLock('pessimistic_write')
      .getOneOrFail();
  }
  publico(p: Produto) {
    return {
      id: p.id,
      titulo: p.titulo,
      descricao: p.descricao,
      valor: (p.precoCentavos / 100).toFixed(2),
      valorPromocional: 0,
      servingSize: p.porcoes,
      limitItens: p.limite,
      imgs: p.imagem
        ? [
            {
              Location: p.imagem,
              ETag: String(p.id),
              Key: String(p.id),
              Bucket: 'catalogo',
            },
          ]
        : [],
      ingredientes: p.ingredientes,
      adicionais: p.adicionais,
    };
  }
  async listar() {
    const cats = await this.db
      .getRepository(Categoria)
      .find({ where: { ativa: true }, order: { ordem: 'ASC' } });
    const products = await this.db.getRepository(Produto).find({
      where: { ativo: true, esgotado: false },
      order: { ordem: 'ASC' },
    });
    return cats.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      produtos: products
        .filter((p) => p.categoriaId === c.id)
        .map((p) => this.publico(p)),
    }));
  }
  async produto(id: number) {
    const p = await this.db.getRepository(Produto).findOne({
      where: { id, ativo: true, esgotado: false },
      relations: { categoria: true },
    });
    if (!p || !p.categoria.ativa)
      throw new NotFoundException('Produto indisponível.');
    return this.publico(p);
  }
  async admin(m: EntityManager = this.db.manager) {
    const version = await m.findOneByOrFail(CatalogoVersao, { id: 1 });
    const cats = await m.find(Categoria, { order: { ordem: 'ASC' } }),
      products = await m.find(Produto, {
        where: { ativo: true },
        order: { ordem: 'ASC' },
      }),
      stock = await m.find(Estoque);
    return {
      version: version.versao,
      categories: cats.map((c) => ({
        id: c.id,
        title: c.titulo,
        badge: c.badge,
        campaign: c.campanha,
        status: c.ativa ? 'active' : 'draft',
        products: products
          .filter((p) => p.categoriaId === c.id)
          .map((p) => ({
            id: p.id,
            title: p.titulo,
            description: p.descricao,
            price: p.precoCentavos / 100,
            image: p.imagem,
            servingSize: p.porcoes,
            stock: {
              saturday: Number(p.estoqueSabado),
              sunday: Number(p.estoqueDomingo),
            },
            forcedSoldOut: p.esgotado,
            productKind: p.tipo,
            components: p.componentes,
            classifications: p.classificacoes,
            stockByDate: Object.fromEntries(
              stock
                .filter((s) => s.produtoId === p.id)
                .map((s) => [
                  s.data,
                  Number(s.capacidade) - Number(s.reservado),
                ]),
            ),
            soldOutByDate: Object.fromEntries(
              stock
                .filter((s) => s.produtoId === p.id)
                .map((s) => [s.data, s.esgotado]),
            ),
          })),
      })),
    };
  }
  validar(dto: SalvarCatalogoDto) {
    const ids = new Set<number>(),
      cats = new Set<string>(),
      products = dto.categories.flatMap((c) => c.products);
    for (const c of dto.categories) {
      if (!c.id.trim() || !c.title.trim() || cats.has(c.id))
        throw new BadRequestException('Categorias inválidas ou repetidas.');
      cats.add(c.id);
    }
    for (const p of products) {
      if (!p.title.trim() || ids.has(p.id))
        throw new BadRequestException('Produtos inválidos ou repetidos.');
      ids.add(p.id);
      if (
        p.image &&
        !/^(https?:\/\/|\/|data:image\/(png|jpeg|webp);base64,)/.test(p.image)
      )
        throw new BadRequestException('Imagem inválida.');
      for (const [date, value] of Object.entries(p.stockByDate ?? {}))
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(value) ||
          value < 0 ||
          value > 100000
        )
          throw new BadRequestException('Estoque por data inválido.');
      for (const [date, value] of Object.entries(p.soldOutByDate ?? {}))
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof value !== 'boolean')
          throw new BadRequestException('Disponibilidade inválida.');
    }
    const map = new Map(products.map((p) => [p.id, p]));
    const visit = (id: number, path: number[]) => {
      const p = map.get(id);
      if (!p)
        throw new BadRequestException('Componente não encontrado no cardápio.');
      if (path.includes(id) || path.length >= 8)
        throw new BadRequestException(
          'Composição circular ou profunda demais.',
        );
      if (p.productKind === 'compound') {
        if (!p.components?.length)
          throw new BadRequestException(
            'Produto composto precisa de componentes.',
          );
        for (const child of p.components) visit(child.productId, [...path, id]);
      }
    };
    products.forEach((p) => visit(p.id, []));
  }
  async salvar(dto: SalvarCatalogoDto, usuarioId: number) {
    this.validar(dto);
    return this.db.transaction(async (m) => {
      const version = await this.bloquear(m);
      if (version.versao !== dto.version)
        throw new ConflictException(
          'O cardápio ou estoque foi atualizado. Recarregue antes de salvar.',
        );
      await m
        .getRepository(Produto)
        .createQueryBuilder()
        .update()
        .set({ ativo: false })
        .execute();
      await m
        .getRepository(Categoria)
        .createQueryBuilder()
        .update()
        .set({ ativa: false })
        .execute();
      for (const [ci, c] of dto.categories.entries()) {
        await m.save(Categoria, {
          id: c.id,
          titulo: c.title.trim(),
          badge: c.badge,
          campanha: c.campaign ?? '',
          ativa: c.status === 'active',
          ordem: ci,
        });
        for (const [pi, p] of c.products.entries()) {
          const existente = await m.findOneBy(Produto, { id: p.id });
          await m.save(Produto, {
            id: p.id,
            categoriaId: c.id,
            titulo: p.title.trim(),
            descricao: p.description,
            precoCentavos: centavos(p.price),
            imagem: p.image,
            porcoes: p.servingSize,
            estoqueSabado: p.stock.saturday,
            estoqueDomingo: p.stock.sunday,
            esgotado: p.forcedSoldOut,
            tipo: p.productKind ?? 'simple',
            componentes: p.components ?? [],
            classificacoes: p.classifications ?? [],
            ingredientes: existente?.ingredientes ?? [],
            adicionais: existente?.adicionais ?? [],
            ativo: true,
            ordem: pi,
          });
          const dates = new Set([
            ...Object.keys(p.stockByDate ?? {}),
            ...Object.keys(p.soldOutByDate ?? {}),
          ]);
          for (const data of dates) {
            const s = await m.findOneBy(Estoque, { produtoId: p.id, data });
            const remaining = p.stockByDate?.[data];
            const defaultStock =
              new Date(data + 'T12:00:00Z').getUTCDay() === 6
                ? p.stock.saturday
                : p.stock.sunday;
            await m.save(Estoque, {
              ...s,
              produtoId: p.id,
              data,
              capacidade:
                remaining !== undefined
                  ? remaining + Number(s?.reservado ?? 0)
                  : (s?.capacidade ?? defaultStock),
              reservado: Number(s?.reservado ?? 0),
              esgotado: p.soldOutByDate?.[data] ?? s?.esgotado ?? false,
            });
          }
        }
      }
      version.versao++;
      await m.save(version);
      await m.save(Auditoria, {
        usuarioId,
        acao: 'catalogo.atualizado',
        recurso: 'catalogo',
        dados: { versao: version.versao },
      });
      return this.admin(m);
    });
  }
}
