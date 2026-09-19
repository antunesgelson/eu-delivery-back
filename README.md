# Assados Zanini — API

NestJS 11, TypeORM e MySQL. Módulos: autenticação, catálogo, clientes/endereços/cupons, pedidos/PDV e pagamentos. Esta implementação evolui o backend existente; a estrutura de banco nova é instalada por migrations explícitas, com `synchronize: false`.

## Instalação local

Requer Node.js 22.13+ e MySQL 8.4+ (testado também com MySQL 9.7).

```sh
npm ci
cp -n .env.example .env
```

Edite `.env`: configure um **banco novo de desenvolvimento**, usuário/senha do MySQL e `JWT_SECRET` aleatório com pelo menos 32 caracteres. Para gerar um segredo local: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` (pelo menos 12 caracteres) antes do seed. O seed só funciona fora de produção, cria oito produtos de demonstração, configurações e o administrador, sem sobrescrever registros existentes. Não cria pedidos, saldo ou avaliações fictícios.

```sh
npm run migration:run
npm run seed
npm run start:dev
```

API: http://127.0.0.1:4052. Swagger: http://127.0.0.1:4052/docs. OpenAPI JSON: `/docs-json`. Frontend: `../eu-delivery`, porta 4051.

### Ambiente isolado preparado nesta implementação

O arquivo não versionado `.env.codex.local` aponta para `zanini_codex_20260915`, exclusivamente no MySQL local. Contém um administrador local com senha aleatória. Consulte `ADMIN_EMAIL`/`ADMIN_PASSWORD` nesse arquivo para entrar em `/signin?callbackUrl=/admin/dashboard`.

```sh
npm ci
npm run build
npm run start:local
```

O script local carrega explicitamente esse arquivo. `.env` e os bancos anteriores foram preservados. Para migrations nesse ambiente:

```sh
DOTENV_CONFIG_PATH=.env.codex.local npm run migration:run
```

## Docker Compose

O Compose local aguarda o MySQL responder, executa as migrations em um serviço próprio e só então inicia a API. As senhas do banco e `JWT_SECRET` são obrigatórios; copie `.env.example` para `.env` e configure esses valores.

```sh
docker compose up --build -d --wait
# Opcional: dados e administrador de desenvolvimento.
docker compose run --rm api node dist/database/seed.js
```

MySQL fica disponível em `127.0.0.1:3308`; a API, em `127.0.0.1:4052`. O Compose é destinado ao desenvolvimento local, usa autenticação de teste e não executa seed automaticamente. O frontend tem um Compose integrado e um teste com volume descartável: veja [validação reproduzível](../eu-delivery/docs/VALIDACAO-INTEGRACAO.md).

A configuração foi validada sem daemon; execução dos containers e MySQL 8.4 ainda pendem de validação. O workflow `.github/workflows/ci.yml` prepara lint, build, testes HTTP/MySQL e compilação da imagem em GitHub Actions, sem deploy.

### Disponibilidade

`GET /health/live` retorna `200 {"status":"ok"}` quando a API responde. `GET /health/ready` consulta o banco e verifica migrations pendentes, com limite de dois segundos: responde `200` quando pronta ou `503 {"status":"unavailable"}`. Ambas são públicas, sem cache e sem informações internas. A suíte HTTP cobre sucesso, falha de banco e migrations pendentes.

## Comandos de verificação

```sh
npm run lint
npm run build
npm run test:e2e
npm audit --omit=dev
```

**Testes de integração:** exigem MySQL local e credenciais com permissão de criar/remover bancos. Cada execução cria um banco novo `zanini_test_<timestamp>`, aplica todas as migrations e remove esse banco ao finalizar. Não utiliza nem limpa o banco definido em `MYSQL_DB`; esse nome é substituído pelo nome temporário antes de criar a aplicação. Recusa host remoto.

No ambiente preparado:

```sh
DOTENV_CONFIG_PATH=.env.codex.local npm run test:e2e
```

São testados login/OTP/refresh/logout/reset, JWT forjado, autorização, isolamento de endereços/pedidos, preço enviado pelo cliente, CEP/taxa, disputa pela última unidade, meio frango, idempotência, cancelamento, cashback, cupom, versão do catálogo, pagamento dividido/rascunhos PDV e webhooks/estorno. O gateway externo é substituído por um contrato de teste. Nenhuma cobrança ou mensagem real é executada.

## Contratos principais

Todas as rotas privadas usam `Authorization: Bearer <access token>`. O frontend guarda tokens em cookies HttpOnly e chama seu próprio proxy. A API também pode ser testada diretamente pelo Swagger.

| Rotas | Operação e acesso |
|---|---|
| `POST /auth/login` | `{email, senha}`; administrador criado por seed ou conta com senha |
| `POST /auth/wp`, `/auth/verify` | `{tel}` no formato `55...`; depois `{desafioId,tel,code}` |
| `POST /auth/refresh`, `/auth/logout`, `GET /auth/me` | refresh rotacionado, revogação e perfil atual |
| `POST /auth/esqueci-senha`, `/auth/redefinir-senha` | e-mail e desafio/token de uso único |
| `POST /auth/google` | valida ID token Google no servidor |
| `GET/PUT /usuario`, `GET /usuario/beneficios` | perfil e benefícios do próprio usuário |
| `GET /endereco/todos`, `GET/DELETE /endereco/:id`, `POST/PUT /endereco` | endereços do titular |
| `GET /categoria/lista/detalhes`, `/categoria/listar`, `/produto/:id` | catálogo público |
| `GET/PUT /admin/catalogo` | catálogo completo com `{version,categories}`; conflito 409 em edição desatualizada |
| `GET/POST/PUT/DELETE /pedido/carrinho`, `PATCH/DELETE /pedido/carrinho/item/:id` | itens, endereço, horário, cupom, cashback e forma de pagamento |
| `GET /pedido/horarios/:data` | horários disponíveis; data `YYYY-MM-DD` |
| `POST /pedido/finalizar` | cabeçalho `Idempotency-Key` de 8–100 caracteres; valores calculados pelo servidor |
| `GET /pedido`, `/pedido/:id` | listagem paginada e detalhe do titular; administrador pode consultar detalhe |
| `POST /pedido/:id/repetir` | adiciona os itens de um pedido do próprio histórico ao carrinho, em uma transação; exige `Idempotency-Key` e recalcula preços e opções |
| `GET /admin/pedidos` | listagem administrativa; `status=active` reúne análise, produção e pronto |
| `PATCH /admin/pedidos/:id/status` | `analysis → production → ready → completed`; cancelamento antes da conclusão |
| `PATCH /admin/pedidos/:id/pagamento` | `{paymentStatus:'paid'}` somente para recebimento presencial |
| `PATCH /admin/pedidos/:id` | observação e reagendamento, com conferência de estoque; horário só antes da produção |
| `POST /admin/pdv` | cliente existente, itens, horário, canal, pagamento; aceita endereço de entrega/ajuste administrativo/parcelas; idempotência obrigatória |
| `GET/POST /admin/pdv/rascunhos`, `DELETE /admin/pdv/rascunhos/:id` | rascunhos por administrador, até 50; sem reserva |
| `GET/POST /admin/clientes`, `PUT /admin/clientes/:id` | buscar/cadastrar/editar clientes sem elevação de perfil |
| `GET /admin/clientes/:id`, `GET /admin/clientes/:id/enderecos` | consultar cliente ativo e seus endereços no PDV; acesso exclusivo de administrador |
| `GET /admin/clientes/:id/beneficios`, `POST /admin/clientes/:id/premios/:premioId/resgatar` | saldo/prêmios e registro de entrega da recompensa |
| `GET /admin/relatorios` | totais de pedidos pagos/concluídos, últimos 12 meses, 50 itens e uso de cupons |
| `GET /cupom/publicos`, `GET/POST/PUT /cupom`, `DELETE /cupom/:id` | cupons; escrita administrativa; exclusão arquiva preservando histórico |
| `GET/PUT/POST /configuracao` | configurações permitidas; escrita administrativa, sem credenciais |
| `GET /pagamento/metodos`, `POST /pagamento/:id/checkout` | disponibilidade e URL de checkout do titular |
| `POST /pagamento/mercadopago/webhook` | assinatura HMAC, consulta ao provedor, valor/moeda/recebedor e referência conferidos |

Listagens de pedidos/clientes: `page` (a partir de 1), `limit` (até 100), `search`, `order=ASC|DESC`. Pedidos também aceitam `status` e `date`. Erros retornam `statusCode`, `message` e `requestId`, sem stack/SQL/segredos.

## Regras de negócio

- Loja única; cliente acessa somente seus recursos e administrador opera a loja.
- Mínimo inicial R$ 35. Valores monetários em centavos. Estoque admite frações de até três casas para composições.
- Retirada: Rua Hélio Laudelino da Silva, 41, Bom Viver — Biguaçu. Horários iniciais: sábado/domingo, 11h30–14h, intervalos de 30 minutos.
- **Entrega confirmada pelo usuário: R$ 10,00, somente CEP 88650-000.** Configuração `ENTREGA`: `{habilitada,taxa,bairros,faixasCep:[{inicio,fim}]}`. Taxa e endereço são gravados no pedido; alteração de configuração não modifica pedidos existentes.
- O estoque é reservado na finalização. Esgotamento por data e composição são verificados dentro da mesma transação; cancelar libera a reserva uma vez.
- Cupom e cashback não acumulam. Coupon usage e saldo são consumidos no checkout. Crédito de cashback ocorre apenas em pedido pago e concluído; percentual inicial 3%. Sem expiração automática até existir uma política de prazo aprovada.
- Fidelidade: seis pedidos concluídos geram um prêmio; administrador registra entrega da maionese. Estorno reverte crédito/ponto e invalida prêmios não elegíveis. Saldo já gasto pode ficar negativo, impedindo novos usos até compensação.
- Ajustes PDV são administrativos e auditados. Pagamento dividido soma exatamente o total calculado pelo servidor. Rascunhos não garantem preço/estoque.
- Pagamento online não pode ser confirmado manualmente. Estorno é feito no provedor e reconciliado pelo webhook; esta API não executa solicitações de estorno externo.

## Integrações e variáveis

### WhatsApp

`WHATSAPP_GATEWAY_URL` e `WHATSAPP_GATEWAY_TOKEN`: gateway HTTP que aceite `POST` com Bearer e JSON `{numero:'55...@c.us',mensagem:'...'}`. Adapte o contrato caso o provedor use outro formato. `AUTH_DELIVERY_MODE=development` retorna `developmentCode` e não envia nada. Esse modo é recusado em produção.

### E-mail

`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `FRONTEND_URL`. Recuperação tem resposta genérica. Em desenvolvimento retorna `desafioId`/`developmentToken`; em integração real envia o link por SMTP. Envio SMTP não foi testado com credenciais reais.

### Google

`GOOGLE_CLIENT_ID` na API; mesmo ID e secret no servidor Next. ID token é validado com a biblioteca oficial, incluindo audiência e e-mail verificado. Vinculação automática por e-mail a uma conta existente é recusada. Não há integração com calendário.

### Mercado Pago

`MERCADO_PAGO_TOKEN`, `MERCADO_PAGO_COLLECTOR_ID`, `MERCADO_PAGO_WEBHOOK_SECRET`, `MERCADO_PAGO_NOTIFICATION_URL` e `MERCADO_PAGO_SANDBOX`. A URL de notificação deve apontar **diretamente à API**, em `/pagamento/mercadopago/webhook`.

O webhook usa `data.id` da query e `x-signature`/`x-request-id`; confere HMAC e tolerância temporal de cinco minutos, consulta `/v1/payments/:id` e verifica valor, moeda BRL, recebedor e pedido. Repetições/eventos mais antigos não duplicam efeitos. `approved` confirma; `refunded`/`charged_back` revertem benefícios e cancelam pedidos ainda não concluídos. Sem credenciais, checkout online fica indisponível. Os testes verificam o contrato local, não uma transação real com o provedor.

Referência: [notificações Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications).

## Expiração de pagamentos online

Regra confirmada pelo usuário: **15 minutos a partir da finalização do pedido**. O prazo é gravado em `pagamentoExpiraEm` e enviado à preferência Mercado Pago. O prazo não reinicia ao abrir o checkout. Pagamento presencial e pedidos já existentes sem prazo não são expirados automaticamente.

A API verifica pedidos vencidos ao iniciar e a cada 30 segundos, em lotes de até 50, com até quatro consultas simultâneas e fila persistida. Online pendente permanece em análise, mesmo com aceite automático; produção exige pagamento confirmado. Antes de cancelar um pedido com checkout emitido, consulta pagamentos aprovados e confere valor, moeda, recebedor e referência. Falhas do provedor preservam a reserva para nova tentativa. A liberação pode ocorrer depois dos 15 minutos devido à verificação periódica ou indisponibilidade do provedor.

A expiração registra `cancelamentoMotivo=pagamento_expirado` e devolve estoque, uso de cupom e cashback numa transação idempotente. Pagamento aprovado após cancelamento recebe `pagamentoStatus=refund_pending`, sem reativar pedido nem reservar estoque novamente. O painel alerta o administrador, que deve efetuar o estorno no provedor; o webhook confirma `refunded`. Nenhum estorno externo é executado automaticamente. A validade da preferência não elimina a possibilidade de confirmação tardia de uma transação já iniciada.

A migration `1789560000000-ExpiracaoPagamento` adiciona colunas e índice, preservando pedidos anteriores sem prazo. Execute `DOTENV_CONFIG_PATH=.env.codex.local npm run migration:run` antes de iniciar a versão atualizada no ambiente local.

A suíte atual contém **37 testes de integração**, incluindo concorrência de expiração, conciliação de aprovação sem webhook, falha do provedor, devolução única de cupom/cashback e aprovação/estorno tardios. As chamadas externas continuam substituídas por contratos de teste.

Referências: [validade da preferência](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/create-preference/post) e [busca de pagamentos](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/search-payments/get).

## Recuperação de falhas de conciliação

A tabela `conciliacoes` mantém uma entrada por pedido online: quantidade de tentativas, falhas consecutivas, categoria da última falha, datas da última consulta/falha/sucesso, próxima tentativa e controle da execução. Cada início, resultado e solicitação administrativa também fica em `auditoria`, sem respostas brutas ou credenciais do provedor.

- Novas tentativas após falha: **30 segundos, 1, 2, 5 e 10 minutos**; tentativas seguintes mantêm o intervalo de 10 minutos.
- A seleção usa a próxima execução elegível, permitindo que outros pedidos avancem quando os anteriores falham.
- Cada execução recebe um identificador exclusivo e um prazo de dois minutos. Outro processo pode retomar após esse prazo; o responsável antigo não sobrescreve o resultado do novo. Uma parada da API preserva a fila no banco.
- As chamadas externas ocorrem fora da transação de estoque. Antes de cancelar, a API bloqueia e confere novamente pedido, pagamento e responsável pela execução. Um checkout criado ou pagamento alterado durante a consulta exige nova verificação. Aprovações por webhook impedem a expiração quando já confirmadas no banco.
- Consulta incompleta, múltiplas aprovações e divergências de valor, moeda, recebedor ou referência preservam a reserva e ficam visíveis ao administrador. Uma confirmação tardia ainda segue o fluxo de estorno pendente.
- O painel mostra pedidos vencidos, tempo pendente, tentativas, motivo e próxima consulta. A listagem é paginada e se atualiza a cada 10 segundos.

| Endpoint | Acesso e comportamento |
|---|---|
| `GET /admin/conciliacoes?page=1&limit=10` | Apenas administrador; lista pedidos vencidos ainda aguardando pagamento, incluindo tentativas em execução |
| `POST /admin/conciliacoes/:id/tentar` | Apenas administrador; resposta 202 agenda nova consulta, sem executar cobrança ou forçar cancelamento |

Solicitações manuais têm intervalo mínimo de **um minuto por pedido**, persistido no banco e aplicado também a administradores diferentes. Pedidos já em verificação retornam 409; pendências resolvidas não aceitam nova solicitação. Solicitar nova consulta não zera o histórico nem as falhas consecutivas.

A migration `1789570000000-Conciliacao` cria a fila e inclui pedidos online existentes que já possuam vencimento e continuem pendentes. Aplicação no ambiente local: `DOTENV_CONFIG_PATH=.env.codex.local npm run migration:run`. Não atribui prazo a pedidos legados sem vencimento.

Os sete testes novos verificam persistência entre instâncias da rotina, intervalos e autorização, limite de solicitações simultâneas, avanço além de 50 falhas, catálogo acessível durante consulta lenta, retomada de execução interrompida, webhook/checkout concorrentes e classificação de divergências. O navegador foi verificado com cenários controlados para paginação, agendamento, erro de carregamento e remoção de alertas resolvidos. A validação real com o provedor continua pendente de credenciais de homologação.

## Testes de pagamento no navegador

O arquivo `test/browser-payment-harness.cjs` permite ao frontend iniciar a API real com gateway de pagamento simulado e banco MySQL temporário exclusivo. Ele aplica as migrations, cria catálogo/clientes de teste e remove o banco criado ao finalizar. Exige MySQL local e permissão para criar/remover bancos; não usa o banco de desenvolvimento para os pedidos desses cenários.

Compile este backend com `npm run build`. No frontend, execute `npm run build` e `npm run test:e2e -- pagamento.spec.ts`. Por padrão, a fixture procura este projeto em `../eu-delivery-back` e lê `.env.codex.local`; `E2E_BACKEND_DIR` e `E2E_BACKEND_ENV` permitem alterar esses caminhos. Os três cenários verificam expiração/conciliação, aprovação tardia/estorno e recuperação de indisponibilidade. Nenhuma cobrança externa é realizada; esta cobertura não equivale à homologação com Mercado Pago.

O mesmo harness atende `recuperacao-senha.spec.ts` do frontend: cria contas temporárias e permite vencer um desafio para validar recuperação de senha, uso único do link e revogação das sessões. Execute `npm run test:e2e -- recuperacao-senha.spec.ts` no frontend após os builds. Esses testes usam `AUTH_DELIVERY_MODE=development` e não enviam e-mails externos.

O frontend também usa o harness em `cupons.spec.ts`, com contas temporárias que podem receber saldo inicial de cashback. Os cupons são cadastrados pelos endpoints administrativos reais; os cenários verificam aplicação/remoção, troca de cashback, cupom privado e uso único. Nenhum saldo de uma conta fora do banco temporário é alterado.

## Datas civis na integração

A conexão MySQL usa `dateStrings: ['DATE']`: aniversário, data de estoque e validade de cupom são strings `YYYY-MM-DD`, sem conversão de fuso. Os campos `DATETIME` continuam representando instantes. Isso corrige a leitura do aniversário como dia anterior em processos no fuso de São Paulo, sem migration ou alteração dos dados armazenados.

Validação em 18/09/2026: 34 testes HTTP/MySQL passaram com `TZ=America/Sao_Paulo DOTENV_CONFIG_PATH=.env.codex.local npm run test:e2e`, incluindo salvamento, leitura e limpeza da data de nascimento. No frontend, `npm run test:e2e -- perfil.spec.ts pagamento.spec.ts` aprovou os seis cenários de perfil/pagamentos com o banco temporário.

## Banco legado e operação

**Não execute as migrations iniciais diretamente na base antiga.** As entidades mudaram e não existe importador automático de dados legados. Use banco novo; para migrar uma instalação existente, exporte uma cópia, mapeie os contratos e reconcilie quantidades, saldos, IDs e histórico antes de qualquer troca. Nenhum banco de produção foi alterado durante o trabalho.

Credenciais que estavam embutidas no código antigo foram removidas dos módulos ativos. Se ainda forem válidas, faça a rotação no respectivo provedor; o histórico Git pode continuar contendo versões antigas.

Não há reembolso automático ou gestão de entregadores. São próximos passos que dependem de políticas da operação. Fotos do catálogo podem ser URLs HTTPS ou dados de imagem com limite de tamanho, armazenadas junto ao produto; armazenamento de mídia externo pode ser adicionado quando necessário.
