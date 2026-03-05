# 🚀 Cesta de Custódia - API (Backend)

Esta é a API central do ecossistema **Cesta de Custódia**, desenvolvida com foco em alta performance, segurança e tipagem estrita. Ela serve como o único ponto de verdade para o banco de dados e as regras de negócio de todos os portais (Comprador, SEAP e Logística).

## 🛠️ Tecnologias e Frameworks

A API utiliza o estado da arte do ecossistema Node.js:

* **Runtime**: Node.js (v20+).
* **Framework**: **Fastify v5** (conhecido por sua baixa sobrecarga e velocidade).
* **Linguagem**: TypeScript para segurança de tipos em tempo de desenvolvimento.
* **Banco de Dados**: PostgreSQL.
* **ORM**: **Drizzle ORM** (para consultas SQL performáticas e seguras).
* **Validação**: **Zod** para validação de esquemas e variáveis de ambiente.
* **Documentação**: Swagger e Scalar para referência de API interativa.

## ✨ Principais Funcionalidades

#### **Autenticação Avançada**:
* Fluxo de **Magic Link** via e-mail para acesso sem senha.
* Emissão e validação de tokens **JWT** com tempo de expiração configurável.
* Proteção de rotas baseada em papéis (`ADMIN`, `FISCAL_SEAP`, `COMPRADOR`, `OPERADOR`).


#### **Gestão de Pedidos**:
* Criação de pedidos com cálculo automático de taxas e frete.
* Fluxo de status (Pendente, Pago, Preparando, Em Trânsito, Entregue).


#### **Módulos de Apoio**:
* Integração com serviço de CEP para preenchimento de endereços.
* Pesquisa dinâmica de internos e unidades prisionais.
* Validador de prescrições médicas (simulado para integração com CFM/ITI).


#### **Auditoria e Estatísticas**:
* Logs de auditoria para ações críticas.
* Endpoints de estatísticas para o dashboard administrativo.



## ⚙️ Variáveis de Ambiente (.env)

O sistema utiliza o Zod para garantir que a aplicação só inicie se as variáveis necessárias estiverem presentes. Principais campos:

``` env
NODE_ENV="development" # ou production
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
AUTH_TOKEN_SECRET="sua_chave_secreta_de_pelo_menos_32_caracteres"
FRONTEND_ORIGIN="http://localhost:3000"
SMTP_HOST="seu_servidor_smtp"
SMTP_USER="usuario_smtp"
SMTP_PASS="senha_smtp"
```

## 🚀 Como Iniciar

### 1. Instalação

```bash
cd api
npm install
```

### 2. Banco de Dados e Migrações

A API utiliza o Drizzle para gerenciar o esquema do banco.

```bash
# Gera os arquivos de migração baseados no esquema
npm run db:generate

# Sincroniza o banco de dados com o esquema atual
npm run db:push
```

### 3. Execução

```bash
# Modo desenvolvimento com hot-reload
npm run dev

# Build para produção
npm run build
npm start
```

## 📜 Documentação da API

Após iniciar o servidor (por padrão em `http://localhost:3333`), você pode acessar a documentação interativa das rotas:

* **API Reference (Scalar)**: `http://localhost:3333/docs`.

## 📂 Estrutura de Pastas Relevantes

* `src/lib/`: Configurações de banco, autenticação, envio de e-mail e validações centrais.
* `src/routes/`: Definição de todos os endpoints separados por domínio.
* `src/scripts/`: Scripts utilitários, como verificação de saúde do banco.