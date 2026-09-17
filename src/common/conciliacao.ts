export const falhasConciliacao = {
  comunicacao: 'Não foi possível consultar o provedor.',
  configuracao: 'A integração de pagamentos precisa ser configurada.',
  resposta_invalida: 'Consulta de pagamentos incompleta ou inválida.',
  divergencia_valor: 'O valor recebido difere do total do pedido.',
  divergencia_moeda: 'A moeda do pagamento difere da esperada.',
  divergencia_recebedor: 'O recebedor do pagamento difere do configurado.',
  divergencia_referencia:
    'A referência ou a transação não corresponde ao pedido.',
  concorrencia: 'O pedido mudou durante a consulta; será verificado novamente.',
  interno: 'Não foi possível concluir a verificação.',
} as const;
export type CategoriaFalha = keyof typeof falhasConciliacao;
export class FalhaConciliacao extends Error {
  constructor(readonly categoria: CategoriaFalha) {
    super(falhasConciliacao[categoria]);
  }
}
export const intervaloTentativa = (falhas: number) =>
  [30, 60, 120, 300, 600][Math.min(Math.max(falhas - 1, 0), 4)] * 1000;
