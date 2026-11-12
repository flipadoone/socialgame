# 🔑 Usuários para Teste

|Logins teste:

A aplicação já possui usuários cadastrados para facilitar a avaliação.

| Perfil | E-mail | Senha |
|--------|---------|--------|


"name": "Usuário Leitor", "email": "leitor@viaappia.com", "password": "Leitor@123"

"name": "Usuário Admin", "email": "admin@viaappia.com", "password": "Admin@123"

### Permissões

| Perfil | Permissões |
|---------|------------|
| **Administrador** | Acesso completo ao sistema (CRUD de incidentes, gerenciamento de usuários, estatísticas e comentários). |
| **Leitor** | Pode visualizar incidentes e consultar estatísticas. |

---

## Integração com o NEMOLANDIA (jogo)

- O jogo faz o login nesta mesma API e abre este app em iframe, entregando a sessão por `postMessage` (veja `frontend/src/app/core/services/game-bridge.ts`). Origens autorizadas: `frontend/src/app/core/config/app-config.ts` (`gameOrigins`), `CORS_ALLOWED_ORIGINS` (backend) e `frame-ancestors` em `frontend/nginx.conf`.
- Contas de demonstração criadas na inicialização (`SEED_DEMO_USERS=false` desativa): `admin@viaappia.com` / `Admin@123` (ADMIN) e `leitor@viaappia.com` / `Leitor@123` (USER).
- **Autorização:** leitura (GET) para qualquer usuário autenticado; criar, editar, excluir e comentar incidentes exige `ROLE_ADMIN` (backend) — a interface também esconde essas ações para leitores.
- `GET /api/v1/auth/me` devolve o usuário atual (valida o token e atualiza os papéis); requisições sem token válido recebem **401**.
- Variáveis do backend: `JWT_SECRET` (mínimo 32 caracteres; **o servidor multiplayer do jogo usa o mesmo segredo**), `JWT_EXPIRATION_MS`, `CORS_ALLOWED_ORIGINS`, `SEED_DEMO_USERS`.
