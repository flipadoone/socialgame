# NEMOLANDIA (socialgame)

Sala isométrica multiplayer em React: andar por pathfinding, conversar em tempo real, trocar/enviar skins, tocar beats juntos e interagir com os móveis. O acesso exige login (backend Spring Boot).

## Rodar

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # sobe o servidor da sala E o jogo (http://localhost:5173)
npm test                    # testes automatizados
npm run build               # build de produção
```
`npm run dev` inicia os dois processos juntos (se já houver um servidor da sala na porta 8787, por exemplo via Docker, ele usa o existente). Para rodar separado: `npm run server` e `npm run dev:client`.
Requer Node 20.19+. O backend e o Incident Manager sobem com `docker compose up --build` em `../incident-management-system`.

## Login, sessão e papéis

- O jogo **só abre após o login** (tela de login/cadastro). A sessão **persiste** entre visitas, é **revalidada** no backend (`GET /api/v1/auth/me`) ao abrir, expira junto com o JWT e sincroniza entre abas. Se o backend estiver fora do ar, o login local (ainda válido) é mantido.
- **Papel vem do JWT assinado pelo servidor:** `ROLE_ADMIN` = **root** (★), `ROLE_USER` = jogador. Editar móveis, o beat e a lista de APIs é exclusivo do root — e o servidor da sala **também** recusa essas ações de quem não é root.
- **Incident Manager:** botão no topo ou duplo clique no Quadro de Avisos. Abre em iframe já autenticado (o jogo entrega a sessão ao Angular por `postMessage`, só para a origem configurada).

## Robô TalkToMe

O robô da sala (`robot.png`) abre a **janela de conversa do TalkToMe** com **um clique**. Usa o canal *Widget* da plataforma: defina `VITE_TALKTOME_WIDGET_KEY` (a `data-client-key` pública do canal) no `.env`. O script só é carregado no primeiro clique; sem a chave (ou com o script bloqueado) o robô mostra um aviso amigável. A API Key secreta do TalkToMe **nunca** deve ir para o jogo. Root pode mover/remover o robô como qualquer móvel (catálogo: "Robô TalkToMe (IA)").

## Painel lateral

O painel de móveis/jogadores pode ser **minimizado** (botão "◀ Minimizar" no painel; "▶ Móveis/Painel" para reabrir) para ver mais do quarto; a escolha fica salva.

## Multiplayer

- **Presença:** veja os avatares (com nome, ★ de root e skin) dos outros jogadores em tempo real. A lista "Na sala" mostra quem está online.
- **Chat universal:** todas as contas logadas compartilham o mesmo chat da sala. As **últimas 50 mensagens ficam salvas** no servidor (`server/data/chat-history.json`): quem entra depois, mesmo com a sala vazia, vê a conversa. O chat mostra o estado da conexão e tem botão **Reconectar**. Para testar com duas contas no mesmo computador use **dois navegadores** (ou uma janela anônima): a sessão fica no `localStorage`, que é compartilhado entre abas do mesmo navegador.
- **Chat funcional:** mensagens para todos, **balões de fala** sobre os avatares, histórico recente ao entrar, avisos de entrada/saída, contador de não lidas, histórico de digitação (↑/↓), limite de 200 caracteres e proteção contra flood. `Enter` abre o chat.
- **Sala compartilhada:** todo jogador entra vendo a sala padrão (`INITIAL_ROOM_OBJECTS` em `src/config/roomConstants.js`); o que o root arruma vira a sala de todos e é salvo em `server/data/room-layouts.json` (apague o arquivo para voltar ao padrão).
- **Beat compartilhado** (somente root altera).

### Comandos do chat
`/help` · `/online` · `/skins` · `/status` · `/clear` · `/logout` · `/export-logs` (root)

## Skins

Botão **🎭 Skins** (ou `/skins`):
- **8 skins prontas** (cores por filtro sobre os sprites do jogo).
- **Adicionar skin própria:** envie **1 imagem** (usada em todas as direções) ou **várias** nomeadas como `avatarimage0.png`…`avatarimage6.png` (parado) e `avatarimagewalking0.png`… (andando). As imagens são reduzidas no navegador (PNG leve, até 8 skins por conta), guardadas por usuário e **vistas por todos na sala**. O servidor só aceita PNG válido e limita o tamanho (nada de SVG).
- GIFs animados usam apenas o primeiro quadro.

## Estrutura

```
src/
  App.jsx, main.jsx            composição do jogo e porteiro de login
  components/                  RoomCanvas (memoizado), ChatTerminal, SkinModal, LoginScreen, modais
  hooks/                       useAuth, useRoomPresence, useRoomChat, useRoomLayout, useSkins, useRoomMovement...
  services/                    authService, roomSocket (conexão única), skinStorage, beatClock, audioService
  config/                      env, skins, roomConstants (sala padrão)
  utils/                       pathfinding (BFS), isoMath
server/roomServer.js           servidor da sala (auth JWT, presença, chat, skins, layout, beat)
tests/                         pathfinding, skins, sessão e servidor (integração via WebSocket)
```

## Otimizações aplicadas

- **Beat fora do estado global:** o passo do sequenciador (8x/s) fazia o app inteiro re-renderizar; agora só a janela da DAW assina o relógio (`beatClock`), e o timer agenda a virada exata do passo em vez de consultar o relógio a cada 12 ms.
- **Canvas memoizado:** piso, paredes, móveis e avatares são componentes `memo`; andar não re-renderiza a sala. Handlers estáveis, listener de zoom nativo não-passivo e digitação do chat isolada no componente do chat.
- **Pathfinding:** BFS com mapa de "pais" e conjunto de bloqueios O(1) (sem copiar caminhos).
- **Áudio:** buffer de ruído gerado uma única vez.
- **Assets:** sprites de caminhada (APNG) recomprimidos **sem perda**: 3,9 MB → 76 KB.
- **Bundle:** modais carregados sob demanda (`React.lazy`) e React em chunk próprio.
- **Rede:** conexão WebSocket única para beat, presença, layout e chat; reconexão com espera exponencial; limites de taxa e tamanho no servidor.

## Segurança

- Servidor valida assinatura (HS256/384/512) e expiração do JWT; rejeita `alg: none`; nome e papel vêm do token.
- Entrada validada: coordenadas, texto do chat, PNG das skins, sprites de móveis só de `/assets/`.
- Defina `ROOM_JWT_SECRET` (igual ao `JWT_SECRET` do backend) e `ROOM_ALLOWED_ORIGINS` em produção; use `wss://`.

## Limitações conhecidas

- Graffiti, post-its e lista de APIs ainda são locais ao navegador.
- O estado do beat e o histórico do chat não sobrevivem ao reinício do servidor (o layout sim).
- Não há colisão entre avatares.
- O estado do beat usa o relógio de cada cliente (relógios muito diferentes desalinham a batida).
