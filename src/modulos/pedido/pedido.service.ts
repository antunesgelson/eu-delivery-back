import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PedidoEntity, StatusPedidoEnum } from "./pedido.entity";
import { In, Repository } from "typeorm";
import { ProdutoEntity } from "../produto/produtos.entity";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";
import { PedidoItensEntity } from "./pedidoItens.entity";

import { AdicionarItemAoCarrinhoDTO } from "./dto/adicionarItemAoCarrinho.dto";

@Injectable()
export class PedidoService {

    constructor(
        @InjectRepository(PedidoEntity) private pedidoRepository: Repository<PedidoEntity>,
        @InjectRepository(ProdutoEntity) private produtoRepository: Repository<ProdutoEntity>,
        @InjectRepository(IngredientesEntity) private ingredienteRepository: Repository<IngredientesEntity>,
        @InjectRepository(PedidoItensEntity) private pedidoItensRepository: Repository<PedidoItensEntity>

    ) { }

    async adicionarItemAoCarrinho(pedido: AdicionarItemAoCarrinhoDTO & { clienteId: any }) {
        // buscar pedido que está com statos "no carrinho" do usuário atual
        let pedido_atual = await this.pedidoRepository.findOne({ where: { cliente: { id: pedido.clienteId }, status: StatusPedidoEnum.NO_CARRINHO } });
        if (!pedido_atual) pedido_atual = new PedidoEntity();
        // verifica se o produto existe
        const produto = await this.produtoRepository.findOne({ where: { id: pedido.produtoId }, relations: ["adicionais", "produtosIngredientes", "produtosIngredientes.ingrediente"] })
        //return produto;
        if (!produto) throw new NotFoundException('Produto não encontrado.');
        // Busca os os ids dos ingredientes adicionados.
        const ingredientes = await this.ingredienteRepository.find({ where: { id: In([pedido.ingredientes]) } });
        //verifica se o valor dos ingredientes do produto é maior que o valor original do produto.
        //se for retorna um erro, isso não pode acontecer.
        const valor_total_ingredientes = ingredientes.reduce((valor_total, item) => valor_total + item.valor, 0);
        const valor_total_do_produto_original = produto.produtosIngredientes.reduce((valor_total, item) => valor_total + item.ingrediente.valor, 0);
        if (valor_total_ingredientes > valor_total_do_produto_original) throw new ConflictException('Valor total do produto não pode ser maior que o preço original.');
        // verifica se os adicionais existem para esse produto e se não ultrapassa a quaidade maxima de adicionais e calcula o valor
        if (produto.adicionais.length == 0 && pedido.adicionais.length > 0) throw new ConflictException('Esse produto não possui adicionais.');
        pedido.adicionais.map((adicionalPeido) => {//verifica se os adicionais enviados estão na lista de permitidos.
            const isExisteAdicional = produto.adicionais.some((produto_adicional) => { return adicionalPeido == produto_adicional.id });
            if (!isExisteAdicional) throw new ConflictException('Adicional não cadastrado para esse produto.')
        })
        //converte o array de numero em array de adicionais, mesma coisa para os ingredientes...
        const pedido_adicionais = produto.adicionais.filter((itemProduto) => { return pedido.adicionais.some((itemPedido) => { return itemPedido == itemProduto.id }) })
        const pedido_ingredientes = await this.ingredienteRepository.find({ where: { id: In(pedido.ingredientes) } })
        const pedido_valor = produto.valor; // adiciona o valor do produto no pedido no momento da compra
        const pedido_valorAdicionais = pedido_adicionais.reduce((total, item) => { return total + item.valor }, 0) // calcula o valor total dos adicionais
        //preenche os dados do pedido atual
        pedido_atual.obs = '';
        pedido_atual.cliente = pedido.clienteId;
        pedido_atual.status = StatusPedidoEnum.NO_CARRINHO
        pedido_atual = await this.pedidoRepository.save(pedido_atual);
        //adicionar o item no pedido..
        const item_pedido_atual = {
            id: null,
            valor: pedido_valor,
            obs: pedido.obs,
            pedido: pedido_atual,
            valorAdicionais: pedido_valorAdicionais,
            quantidade: pedido.quantidade,
            ingredientes: pedido_ingredientes,
            adicionais: pedido_adicionais,
            produto: produto
        }
        const itemPedido = await this.pedidoItensRepository.save(item_pedido_atual)
        return itemPedido;
    }

    async itensDoCarrinho(itensDoCarrinhoDTO: { usuarioId: number }) {
        const pedido_carrinho = await this.pedidoRepository.findOne({ where: { cliente: { id: itensDoCarrinhoDTO.usuarioId }, status: StatusPedidoEnum.NO_CARRINHO }, relations: ["itens"] })
        const pedido_valorTotal = pedido_carrinho.itens.reduce((total, item) => { return total + ((item.valor + item.valorAdicionais)* item.quantidade) }, 0)
        return {...pedido_carrinho,valorTotalPedido: pedido_valorTotal};
    }

    async editarQuantidadeDeItensNoCarrinho(item){
        //validar numero negativo
        const pedido_carrinho = await this.pedidoRepository.findOne({ where: { cliente: { id: item.usuarioId }, status: StatusPedidoEnum.NO_CARRINHO }, relations: ["itens"] })
        const itemPedido = pedido_carrinho.itens.find((itemFind)=>{return itemFind.id == item.pedidoItemId})
        if(!itemPedido) throw new NotFoundException('Item não encontrado.');

        itemPedido.quantidade = item.quantidade; 
        return this.pedidoItensRepository.save(itemPedido);
    }

    async removerItemDoCarrinho(item){
        const pedido_carrinho = await this.pedidoRepository.findOne({ where: { cliente: { id: item.usuarioId }, status: StatusPedidoEnum.NO_CARRINHO }, relations: ["itens"] })
        const itemPedido = pedido_carrinho.itens.find((itemFind)=>{return itemFind.id == item.pedidoItemId})
        if(!itemPedido) throw new NotFoundException('Item não encontrado.');
        return this.pedidoItensRepository.delete(itemPedido.id);
    }

    async buscarUltimosPedidos(){
        
    }
}