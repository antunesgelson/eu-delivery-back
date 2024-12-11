eventos:
pagamento.aprovado => envia um evento com os dados do pagamento quando é recebido um novo registro de pagamento aprovado.

pagamento.change => envia um evento com os dados do pagamento toda vez que tiver uma mudança, implementar isso em uma api de notificação 
do telegran seria intereçante para identificar se tem charge_back.

pagamento.error => se ocorrer algum erro no pagamento será disparado esse evento.