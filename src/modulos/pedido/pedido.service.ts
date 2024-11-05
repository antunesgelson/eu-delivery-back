import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { enderecoPedido, PedidoEntity, StatusPedidoEnum } from "./pedido.entity";
import { Between, In, Like, Not, Repository } from "typeorm";
import { ProdutoEntity } from "../produto/produtos.entity";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";
import { PedidoItensEntity } from "./pedidoItens.entity";

import { AdicionarItemAoCarrinhoDTO } from "./dto/adicionarItemAoCarrinho.dto";
import { BuscarPedidoPorIdDTO } from "./dto/buscarPedidoPorId.dto";
import { EnderecoService } from "../endereco/endereco.service";
import { AlterarEnderecoDataDeEntregaDTO } from "./dto/alterarPedido.dto";
import { EnderecoEntity } from "../endereco/endereco.entity";
import { plainToClass, plainToInstance } from "class-transformer";
import { PedidoDto } from "./dto/pedido.dto";
import { CupomEntity } from "../cupom/cupom.entity";
import { ConfiguracaoService } from "../configuracao/configuracao.service";

@Injectable()
export class PedidoService {

    constructor(
        @InjectRepository(PedidoEntity) private pedidoRepository: Repository<PedidoEntity>,
        @InjectRepository(ProdutoEntity) private produtoRepository: Repository<ProdutoEntity>,
        @InjectRepository(IngredientesEntity) private ingredienteRepository: Repository<IngredientesEntity>,
        @InjectRepository(PedidoItensEntity) private pedidoItensRepository: Repository<PedidoItensEntity>,
        @InjectRepository(EnderecoEntity) private enderecoRepository: Repository<EnderecoEntity>,
        @InjectRepository(CupomEntity) private cupomRepository: Repository<CupomEntity>,
        private readonly enderecoService: EnderecoService,
        private readonly configuracaoService: ConfiguracaoService
    ) { }

    async adicionarItemAoCarrinho(pedido: AdicionarItemAoCarrinhoDTO & { clienteId: any }) {
        //quantidade de itens do carrinho não deve ser menor que 1
        if (pedido.quantidade < 1) throw new ConflictException('A quantidade minima não deve ser menor que 1')
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
        console.log(item_pedido_atual)
        const itemPedido = await this.pedidoItensRepository.save(item_pedido_atual)
        return itemPedido;
    }

    async itensDoCarrinho(itensDoCarrinhoDTO: { usuarioId: number }) {
        const pedido_carrinho = await this.pedidoRepository.findOne({ where: { cliente: { id: itensDoCarrinhoDTO.usuarioId }, status: StatusPedidoEnum.NO_CARRINHO }, relations: ["itens", "itens.produto"] })
        if (!pedido_carrinho) throw new NotFoundException('Pedido não encontrado.')
        const pedido_valorTotal = pedido_carrinho.itens.reduce((total, item) => { return total + ((item.valor + item.valorAdicionais) * item.quantidade) }, 0)
        if (Object.keys(pedido_carrinho.endereco).length == 0) {// se não tem o endereço adiciona o mais relevante...
            const endereco = await this.enderecoService.buscarEnderecoFavoritoOuMaisRelevante({ usuarioId: itensDoCarrinhoDTO.usuarioId })
            if (endereco) pedido_carrinho.endereco = endereco as enderecoPedido;
            await this.pedidoRepository.save(pedido_carrinho);
        }
        return { ...pedido_carrinho, valorTotalPedido: pedido_valorTotal };
    }


    async alterarPedido(dto: AlterarEnderecoDataDeEntregaDTO & { usuarioId: number }) {
        const pedido_carrinho = await this.pedidoRepository.findOne({ where: { cliente: { id: dto.usuarioId }, status: StatusPedidoEnum.NO_CARRINHO } })
        if (!pedido_carrinho) throw new NotFoundException('Pedido não encontrado.')
        if (dto.enderecoId) {
            const endereco = await this.enderecoRepository.findOne({ where: { id: dto.enderecoId, usuario: { id: dto.usuarioId } } })
            if (!endereco) throw new NotFoundException('Endereço não encontrado.')
            pedido_carrinho.endereco = endereco as enderecoPedido;
        }
        Object.assign(pedido_carrinho, dto);
        if (dto.cupom) {
            const cupom = await this.cupomRepository.findOne({ where: { nome: dto.cupom } });
            if (cupom) {
                pedido_carrinho.cupomId = cupom.id;
            } else {
                pedido_carrinho.cupomId = '';
            }
        }



       
        //Verificando se existe e deixando apenas ou a data ou o periodo.
        if (dto.periodoEntrega) {
            console.log('............')
            pedido_carrinho.dataEntrega = dto.periodoEntrega.data;
            pedido_carrinho.periodoEntrega = dto.periodoEntrega.periodo;
        }
        if (dto.dataEntrega && pedido_carrinho.periodoEntrega) { pedido_carrinho.periodoEntrega = null; }


       console.log(pedido_carrinho)
        await this.pedidoRepository.save(pedido_carrinho);
        if (dto.cupom && pedido_carrinho.cupomId == "") throw new ConflictException('Cupom não encontrado');
        return plainToInstance(PedidoDto, pedido_carrinho);
    }


    async editarQuantidadeDeItensNoCarrinho(item) {
        //validar numero negativo
        const pedido_carrinho = await this.pedidoRepository.findOne({ where: { cliente: { id: item.usuarioId }, status: StatusPedidoEnum.NO_CARRINHO }, relations: ["itens"] })
        const itemPedido = pedido_carrinho.itens.find((itemFind) => { return itemFind.id == item.pedidoItemId })
        if (!itemPedido) throw new NotFoundException('Item não encontrado.');

        itemPedido.quantidade = item.quantidade;
        return this.pedidoItensRepository.save(itemPedido);
    }

    async removerItemDoCarrinho(item) {
        const pedido_carrinho = await this.pedidoRepository.findOne({ where: { cliente: { id: item.usuarioId }, status: StatusPedidoEnum.NO_CARRINHO }, relations: ["itens"] })
        const itemPedido = pedido_carrinho.itens.find((itemFind) => { return itemFind.id == item.pedidoItemId })
        if (!itemPedido) throw new NotFoundException('Item não encontrado.');
        return this.pedidoItensRepository.delete(itemPedido.id);
    }

    async buscarUltimosPedidos(itensDoCarrinhoDTO: { usuarioId: number }) {
        const pedidos = [];
        const pedidos_carrinho = await this.pedidoRepository.find({ where: { cliente: { id: itensDoCarrinhoDTO.usuarioId }, status: Not(StatusPedidoEnum.NO_CARRINHO) }, relations: ["itens"] })
        for (const pedido_carrinho of pedidos_carrinho) {
            const pedido_valorTotal = pedido_carrinho.itens.reduce((total, item) => { return total + ((item.valor + item.valorAdicionais) * item.quantidade) }, 0)
            pedidos.push({ ...pedido_carrinho, valorTotalPedido: pedido_valorTotal })
        }
        return pedidos
    }

    async buscarPedidoPorId(itensDoCarrinhoDTO: BuscarPedidoPorIdDTO & { usuarioId: number }) {
        console.log(itensDoCarrinhoDTO);
        const pedido_carrinho = await this.pedidoRepository.findOne({ where: { cliente: { id: itensDoCarrinhoDTO.usuarioId }, id: itensDoCarrinhoDTO.pedidoId }, relations: ["itens"] })
        if (!pedido_carrinho) throw new NotFoundException('Pedido não encontrado.')
        const pedido_valorTotal = pedido_carrinho.itens.reduce((total, item) => { return total + ((item.valor + item.valorAdicionais) * item.quantidade) }, 0)
        return { ...pedido_carrinho, valorTotalPedido: pedido_valorTotal };
    }

    async horariosDisponiveis(dto) {
        //1) buscar todos pedidos que tem status: pago, em preparação, aguardando pagamento do dia passado como parametro.
        //2) verificar se o sistem tem configurado o intervaloDeEntrega se não deixa o padrão de 30 min.
        //3) verificar se o dia selecionado é um dia que o emporio abre. se não for retornar um array vazio de horarios.. 
        //4) gerar um array de horarios do horario de abertura até o fechamento/intervalos, cuidado apra não passar os horarios..
        //5) depois de gerar o array, verificar os horarios que estão ocupados e macar-los 
        //recebe um dia e retorna os horarios disponiveis na quele dia.. 
        const dataInicio = new Date(`${dto.data}T00:00:00-03:00`);
        const dataFim = new Date(`${dto.data}T23:59:59-03:00`);
        //1)
        const pedidos = await this.pedidoRepository.find({ where: { dataEntrega: Between(dataInicio, dataFim) } })
        //2)
        let intervaloDeEntrega = await this.configuracaoService.getConfig({ chave: 'intervaloDeEntrega', isAdmin: true })
            .then((value) => {
                if (value && value.valor !== undefined) {
                    let result = parseInt(value.valor, 10);
                    if (result.toString() == 'NaN') return undefined
                    return result;
                }
                return undefined;
            })
            .catch(() => undefined);
        intervaloDeEntrega ??= 30 //caso não tenha um valor definido deve atribuir o valor 30.
        const listaHorariosDisponiveis: { data: Date, livre: boolean }[] = [];
        let horariosResult = []
        //aqui gera todos horarios disponiveis agora tem que verificar com os que já estão em uso..    
        let horarioAtendimento = await this.configuracaoService.getConfig({ chave: 'horarioAtendimento', isAdmin: true }).then((value) => JSON.parse(value.valor)).catch(() => undefined);
        const diasDaSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
        horarioAtendimento = horarioAtendimento[diasDaSemana[dataInicio.getDay()]]
        console.log(horarioAtendimento)
        if (horarioAtendimento.abertura && horarioAtendimento.abertura != '') {
            let intervalos = []
            if (horarioAtendimento.inicio_intervalo && horarioAtendimento.inicio_intervalo != "") {
                intervalos.push(...this.gerarArrayHorarios(horarioAtendimento.abertura, horarioAtendimento.inicio_intervalo, intervaloDeEntrega))
                intervalos.push(...this.gerarArrayHorarios(horarioAtendimento.fim_intervalo, horarioAtendimento.fechamento, intervaloDeEntrega))
            } else {
                intervalos = this.gerarArrayHorarios(horarioAtendimento.abertura, horarioAtendimento.fechamento, intervaloDeEntrega)
            }
            horariosResult = intervalos.map((item) => { return { "horario": item, disponivel: true } })
        }
        for (const pedido of pedidos) {
            let horarioPedido = `${pedido.dataEntrega.getHours().toString().padStart(2, '0')}:${pedido.dataEntrega.getMinutes().toString().padStart(2, '0')}`
            for (const compararHorarios of horariosResult) {
                if (compararHorarios.horario == horarioPedido) {
                    compararHorarios.disponivel = false;
                }
            }
        }
        return horariosResult;
    }

    async finalizarPedido() {
        return 'finalizar pedido';
    }

    private gerarArrayHorarios(horaInicio, horaFim, intervaloMinutos) {
        let horarios = [];
        let inicio = new Date(`1970-01-01T${horaInicio}:00`);
        let fim = new Date(`1970-01-01T${horaFim}:00`);
        while (inicio.getTime() + intervaloMinutos * 60000 <= fim.getTime()) {
            let horas = inicio.getHours().toString().padStart(2, '0');
            let minutos = inicio.getMinutes().toString().padStart(2, '0');
            horarios.push(`${horas}:${minutos}`);
            inicio.setMinutes(inicio.getMinutes() + intervaloMinutos);
        }
        return horarios;
    }

}