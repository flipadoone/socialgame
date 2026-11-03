# Habbo Studio — refatoração modular

Projeto React + Vite + Tailwind, em JavaScript ESM, preservando a engine isométrica e separando responsabilidades.

## Instalação
1. Copie `src/` para o projeto Vite existente.
2. Instale React/ReactDOM e configure Tailwind como já utilizado pelo projeto.
3. Coloque os PNG/GIF originais em `public/assets/` mantendo os caminhos `/assets/...`.
4. Execute `npm run dev -- --host 0.0.0.0`.

## Estrutura
- `src/constants/roomConstants.js`: medidas, sprites, catálogo e objetos iniciais.
- `src/utils/isoMath.js`: projeção, direção, BFS e vizinhança.
- `src/services/authService.js`: sessão JWT e validação de origem/payload.
- `src/hooks/useAngularAuth.js`: listener postMessage.
- `src/services/audioService.js`: Web Audio API.
- `src/components/*`: modais, terminal e viewport.
- `src/App.jsx`: estado/orquestração.

## Integração Angular
Após autenticação bem-sucedida, dentro do iframe Angular:
```ts
window.parent.postMessage(
  { type: 'LOGIN_SUCCESS', token: response.token },
  'http://localhost:5173'
);
```
Em produção, substitua as origens localhost por URLs HTTPS explícitas e mantenha a allowlist sincronizada nos dois lados. Não use `'*'` como targetOrigin.

## Segurança importante
- O React só aceita mensagens das origens `http://localhost:4200` e `http://127.0.0.1:4200`.
- O evento precisa ter `type: 'LOGIN_SUCCESS'` e token não vazio.
- `localStorage` não é armazenamento inviolável. A presença do JWT habilita a interface, mas **não substitui validação/autorização no backend**. Operações Root devem ser autorizadas pelo servidor.
- `/exit` remove apenas `habbo_jwt_token`; não usa `localStorage.clear()`, pois isso apagaria também móveis, mural, post-its e preferências locais. Se o requisito for literalmente limpar todo o armazenamento da origem, altere `clearSession({ all: true })` conscientemente.
- O iframe usa `title`, `referrerPolicy` e `sandbox`. Ajuste as permissões do sandbox conforme os recursos realmente usados pelo Angular. Se o Angular depender de popups/downloads, libere somente as flags necessárias.
- Não coloque segredo de API no frontend.

## Tipos
O projeto usa JSX/JS para encaixar no Vite existente. `src/types/index.ts` é opcional e documenta os contratos TypeScript; pode ser adotado gradualmente.

## Estrutura alinhada ao projeto do VS Code

A organização foi ajustada para usar `src/config/roomConstants.js`,
`src/components/AchievementsMenuModal.jsx`, `src/components/RoomCanvas.jsx`,
`src/utils/isoMath.jsx` e `src/utils/pathfinding.js`, mantendo também os
componentes auxiliares `ChatTerminal.jsx` e `NoticeboardModal.jsx`.

## Beat compartilhado da sala

O player de áudio agora fica montado no nível da sala, fora do modal da DAW. Fechar a janela não interrompe a reprodução. Cada visitante precisa clicar uma vez em **Ativar áudio do quarto**, pois os navegadores bloqueiam áudio automático antes de uma interação do usuário.

Para ouvir o mesmo beat em computadores/navegadores diferentes, configure `VITE_ROOM_WS_URL` e inicie o relay WebSocket:

```bash
npm run server:audio
npm run dev
```

O exemplo usa `ws://localhost:8787` e sala `habbo-main-room`. Em produção, hospede `server/roomBeatServer.js` em um servidor acessível a todos, use `wss://` atrás de TLS e configure o mesmo `VITE_ROOM_WS_URL`/`VITE_ROOM_ID` para todos. O servidor de exemplo é um relay simples: para produção, adicione autenticação, autorização por sala, limites de taxa e validação de quem pode alterar o beat. Sem `VITE_ROOM_WS_URL`, o fallback `BroadcastChannel` sincroniza apenas abas do mesmo navegador, não computadores diferentes.


## Sessão ROOT e conquistas

- Minimizar/fechar o modal do Incident Manager apenas fecha a janela; não encerra a sessão.
- O token JWT fica salvo em `localStorage` e o modo ROOT permanece ativo após minimizar ou recarregar a aplicação.
- A sessão só é encerrada pelo botão **Sair** ou pelo comando `/exit`; isso remove somente `habbo_jwt_token`, preservando móveis, graffiti, APIs, logs e conquistas.
- O Angular deve enviar `window.parent.postMessage({ type: 'LOGIN_SUCCESS', token: response.token }, 'http://localhost:5173')` após autenticação concluída. O emissor deve estar em uma origem permitida em `src/services/authService.js`.
- A conquista **Hacker** é liberada no login confirmado; **Primeiro Risco** ao salvar graffiti; **DJ do Quarto** ao iniciar o beat. As conquistas são persistidas em `habbo_achievements`.
- A ativação visual de ROOT no cliente é apenas uma conveniência de interface. O backend deve validar o JWT e autorizar cada operação privilegiada; nunca confie somente no estado React ou em `localStorage`.


## Refatoração adicional da camada de estado

A versão modularizada também separa a lógica que antes estava concentrada no `App.jsx`:

- `hooks/useRoomData.js`: persistência de móveis, graffiti, auditoria e APIs.
- `hooks/useAchievements.js`: desbloqueio, toast e persistência das conquistas.
- `hooks/useRoomBeat.js`: estado da DAW e sincronização do beat da sala.
- `hooks/useRoomMovement.js`: movimento do avatar, pathfinding, colocação/movimentação de móveis e interação espacial.
- `hooks/useAngularAuth.js`: recebimento do evento de autenticação Angular.

O `App.jsx` fica como ponto de composição da interface e ligação entre os hooks e os componentes. O código foi mantido funcionalmente equivalente ao projeto recebido, sem remover os componentes existentes.

### Verificação

Os arquivos JavaScript/JSX foram verificados por parser e os imports locais foram conferidos. O build do Vite não pôde ser confirmado neste ambiente porque o `node_modules` incluído no ZIP original não contém o binding nativo de Rolldown compatível com o ambiente de execução. No computador de desenvolvimento, reinstale as dependências com `npm install` antes de executar `npm run build`.
