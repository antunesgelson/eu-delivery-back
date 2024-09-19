import {  Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PedidoEntity, StatusPedidoEnum } from "./pedido.entity";
import { In, Repository } from "typeorm";
import { ProdutoEntity } from "../produto/produtos.entity";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";

@Injectable()
export class PedidoService{

    constructor(
        @InjectRepository(PedidoEntity) private pedidoRepository:Repository<PedidoEntity>,
        @InjectRepository(ProdutoEntity) private produtoRepository:Repository<ProdutoEntity>,
        @InjectRepository(IngredientesEntity) private ingredienteRepository:Repository<IngredientesEntity>
    ){}

    async adicionarItemAoCarrinho(pedido){
        // buscar pedido que está com statos "no carrinho" do usuário atual
        let pedido_atual = await this.pedidoRepository.findOne({where:{cliente:{id:pedido.clienteId},status:StatusPedidoEnum.NO_CARRINHO}});
        if(!pedido_atual) pedido_atual = new PedidoEntity();
        
        // verifica se o produto existe
        const produto = await this.produtoRepository.findOne({where:{id:pedido.produtoId},relations:["adicionais","produtosIngredientes","produtosIngredientes.ingrediente"]})
        //return produto;
        if(!produto) throw new NotFoundException('Produto não encontrado.');

        // verifica se os ingredientes adicionados não passam do valor original do produto..
        const ingredientes = await this.ingredienteRepository.find({where:{id: In([pedido.ingredientes])}});
        const valor_total_ingredientes = ingredientes.reduce((valor_total,item)=>valor_total+item.valor,0);
        const valor_total_do_produto_original = produto.produtosIngredientes.reduce((valor_total,item)=>valor_total+item.ingrediente.valor,0);
        return valor_total_do_produto_original
         

        // verifica se os adicionais existem para esse produto e se não ultrapassa a quaidade maxima de adicionais e calcula o valor
        // adiciona uma observação
        // quantidade...

    }
}