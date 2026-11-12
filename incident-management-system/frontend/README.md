# 📌 Via Appia - Incident Management System

Sistema desenvolvido como solução para o Desafio Técnico Fullstack da Via Appia.

A aplicação permite o gerenciamento de demandas internas da empresa, oferecendo autenticação JWT, CRUD completo de incidentes, filtros, controle de status e interface inspirada em um mural físico de avisos.

---

# Tecnologias

## Backend

- Java 21
- Spring Boot 3
- Spring Security
- JWT
- Spring Data JPA
- PostgreSQL
- Flyway
- Maven
- Docker
- Swagger/OpenAPI
- Caffeine Cache

## Frontend

- Angular 20
- TypeScript
- Reactive Forms
- Angular Router
- HttpClient
- CSS puro
- HTML5

---

# Funcionalidades

## Autenticação

- Cadastro de usuários
- Login
- JWT
- Interceptor automático
- Logout

---

## Demandas

- Criar demanda
- Listar demandas
- Editar demanda
- Excluir demanda
- Buscar por título
- Filtrar por:
  - Status
  - Prioridade
  - Categoria
- Alteração de status
- Reabrir demanda
- Interface responsiva

---

## Status suportados

- OPEN
- IN_PROGRESS
- RESOLVED
- CLOSED

---

## Prioridades

- LOW
- MEDIUM
- HIGH
- CRITICAL

---

## Categorias

- HARDWARE
- SOFTWARE
- NETWORK
- SECURITY
- OTHER

---

# Interface

A interface foi desenvolvida utilizando um conceito de mural físico de avisos.

Características:

- Post-its coloridos
- Pins
- Carimbo de prioridade
- Ícones pixel art
- Modal personalizado
- Responsividade
- Layout exclusivo

---

# Backend

Estrutura em camadas:

```
Controller

↓

Service

↓

Repository

↓

Database
```

Utiliza:

- DTOs
- Mapper
- Specification
- Cache
- Validação
- Exceptions customizadas

---

# Banco de Dados

PostgreSQL executando em Docker.

Migrações controladas pelo Flyway.

Tabelas:

- users
- roles
- incidents
- comments

---

# Executando o projeto

## Backend

```bash
cd backend

docker compose up -d

.\mvnw spring-boot:run
```

---

## Frontend

```bash
cd frontend

npm install

ng serve
```

Frontend:

```
http://localhost:4200
```

Swagger:

```
http://localhost:8080/swagger-ui/index.html
```

---

# Build

Backend

```bash
.\mvnw clean test
```

Frontend

```bash
ng build
```

---

# Estrutura

```
backend/
│
├── controller
├── dto
├── entity
├── exception
├── mapper
├── repository
├── security
├── service
├── specification
└── resources

frontend/
│
├── core
├── pages
├── services
├── models
└── public
```

---

# Diferenciais implementados

- Interface temática exclusiva
- JWT
- CRUD completo
- Cache
- Flyway
- Docker
- Swagger
- Busca dinâmica
- Filtros
- Alteração de status
- Responsividade
- Ícones pixel art personalizados
- Código organizado por responsabilidades

---

# Status atual do projeto

## ✅ Implementado

- Autenticação JWT
- Cadastro de usuários
- Login
- Logout
- CRUD completo de demandas
- Alteração de status
- Exclusão de demandas
- Edição de demandas
- Busca por título
- Filtros
- Cache com Caffeine
- Flyway
- Docker (PostgreSQL)
- Swagger/OpenAPI
- Interface personalizada
- Responsividade
- Build do backend
- Build do frontend

---

## 🚧 Em desenvolvimento

- Persistência dos comentários (backend já criado, integração final pendente)
- Estatísticas do dashboard
- Paginação no frontend
- Ordenação das demandas
- Perfis Leitor e Escritor
- Docker Compose completo (frontend + backend + banco)
- Testes adicionais
- Ajustes finais da apresentação

---

# Autor

Filipe Lopes dos Santos

Desenvolvido para o Desafio Técnico Fullstack da Via Appia.