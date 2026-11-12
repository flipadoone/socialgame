# Revisão do projeto — o que estava quebrado e o que mudou

## Incident Manager: por que o acesso não funcionava
| Problema encontrado | Correção |
|---|---|
| `frontend/src/app/app.ts` continha **código React** (o jogo foi colado por cima do componente raiz): o Angular não compilava | Componente raiz Angular restaurado |
| Existia uma cópia duplicada do app em `frontend/src/src/` (também compilada pelo tsconfig) | Removida |
| `angular.json` com **JSON inválido** (vírgula faltando): `ng serve`/`ng build`/Docker quebravam | Arquivo corrigido |
| `Auth` não tinha `logout()` (o dashboard o chama): erro de compilação | `logout()` e `isAuthenticated()` implementados |
| Tela de login vinha preenchida com `admin@viaappia.com / Admin@123`, **usuário que não existia** no banco (só havia `user@email.com`) | Backend cria as contas documentadas no README; login não vem mais preenchido |
| `authGuard` retornava sempre `true`: o painel abria sem login | Guard real (com `returnUrl`) + guard para a tela de login |
| Token expirado continuava "valendo" no navegador | `isAuthenticated()` confere a expiração (`exp`) |
| Handshake com o jogo enviava `postMessage` para a porta errada (5174) | Ponte `GameBridge` com origens configuráveis, sem `'*'` |
| URLs `http://localhost:8080` espalhadas pelos serviços | `core/config/app-config.ts` |

## Backend (Spring Boot)
- **Autorização por perfil:** qualquer usuário autenticado podia criar/editar/excluir incidentes (o README dizia que o leitor só consulta). Agora POST/PUT/PATCH/DELETE exigem `ROLE_ADMIN`; a interface esconde essas ações para leitores.
- **CORS** só liberava `http://localhost:4200`; agora vem de `CORS_ALLOWED_ORIGINS` (inclui o jogo).
- Sem token válido a API respondia 403; agora **401** (o front redireciona ao login). Token expirado/inválido não gera mais erro 500 no filtro.
- Segredo do JWT saiu do código: `JWT_SECRET` / `JWT_EXPIRATION_MS` (valor de desenvolvimento como padrão).
- Novo `GET /api/v1/auth/me` (valida a sessão e atualiza os papéis); `/auth/login` e `/auth/register` continuam públicos.
- Usuários de demonstração (`admin@`, `leitor@`) criados na inicialização; `SEED_DEMO_USERS=false` desliga.
- Removido arquivo `.ts` perdido dentro da pasta Java (`service/incident-stats.ts`).

## Jogo (NEMOLANDIA)
- **Login obrigatório ao abrir**, sessão persistente, revalidada no backend, com expiração e sincronização entre abas. **Root = `ROLE_ADMIN` do JWT.**
- **Incident Manager** abre autenticado (sessão entregue ao Angular por `postMessage` com origem fixa).
- **Skins:** 8 prontas + envio de skins próprias (1 imagem ou conjunto por direção), troca a qualquer momento, sincronizada com todos na sala.
- **Multiplayer:** presença em tempo real, sala compartilhada persistida, beat sincronizado.
- **Chat funcional:** tempo real para todos, balões de fala, histórico, avisos de entrada/saída, não lidas, comandos, anti-flood.
- **Segurança:** removido o listener de `postMessage` sem checagem de origem e o `isRootUser = true` "de teste" (todo visitante era root); servidor valida JWT (HS256/384/512, rejeita `none`) e sanitiza tudo que recebe.
- **Otimizações:** relógio do beat fora do estado global (o app inteiro re-renderizava 8x/s), canvas memoizado, BFS com mapa de pais, buffer de ruído reaproveitado, sprites APNG 3,9 MB → 76 KB sem perda, modais com `React.lazy`, chunk próprio do React, `localStorage` com debounce.
- Corrigidos: sprites de caminhada apontando para `.gif` inexistente, direção 7 sem sprite, zoom com `preventDefault` em listener passivo, `package.json` sem a dependência `ws`, código morto removido.
- 17 testes automatizados (`npm test`), incluindo o servidor via WebSocket com tokens reais.

## Como foi verificado (e o que não foi)
- Angular: `ngc` (compilador oficial) sem erros no app e nos testes.
- Jogo: `npm test` (17/17) + renderização de teste do app, login, chat, skins e canvas.
- Java: **somente análise de sintaxe** — não havia Maven/JDK de compilação no ambiente. Rode `docker compose up --build` para compilar.
- **Não testado ao vivo:** o fluxo completo no navegador (Vite + Docker). Siga o README e me avise de qualquer erro.


---

## Atualização: robô TalkToMe, painel recolhível e chat
- **Robô TalkToMe:** o `robot.png` abre a janela do TalkToMe com um clique (widget oficial, carregado sob demanda); conquista "Papo com o Robô". O modal antigo (iframe com URL vazia) foi substituído por um aviso amigável.
- **Ventilador removido** da sala padrão e do layout salvo (era o "robô cinza" no meio da sala); o robô foi colocado em (2,6).
- **Painel lateral minimizável** (lembra a escolha).
- **Chat universal:** `npm run dev` agora sobe o servidor da sala junto (antes exigia um segundo terminal; sem ele o chat ficava "em modo solo"); histórico das últimas 50 mensagens **persistido** (antes sumia quando a sala esvaziava); estado da conexão e botão Reconectar no chat; serviço `room-server` no `docker-compose`; o servidor lê o `.env`.
- Bug corrigido na sala padrão: o `id` do catálogo sobrescrevia o id dos objetos.
- O stub `ai-dialogue` (respostas fictícias) do servidor foi removido; a conversa real acontece pelo widget.
- Testes: 18 (inclui um teste com o **cliente real** `roomSocket.js`: duas contas conversam e uma terceira vê o histórico).
