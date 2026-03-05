## 🧺 Cesta de Custódia

O **Cesta de Custódia** é um ecossistema digital completo e integrado, desenvolvido para modernizar e gerenciar a aquisição, fiscalização e logística de suprimentos essenciais (alimentos, higiene, vestuário e medicamentos) para internos do sistema prisional. O projeto visa conectar familiares, advogados, representantes consulares, órgãos de fiscalização e operadores logísticos em uma plataforma única e auditável.

## 🏗️ Arquitetura do Sistema

O sistema é distribuído em uma arquitetura de microsserviços e múltiplas interfaces, garantindo isolamento de responsabilidades e segurança:

- **`api/`**: O "coração" do sistema. Um backend de alta performance que gerencia a lógica de negócio, autenticação e persistência de dados.
- **`frontend/`**: Portal do Comprador. Interface voltada para familiares e advogados realizarem pedidos e consultarem o catálogo.
- **`fiscal/`**: Portal de Fiscalização (SEAP). Painel administrativo para monitoramento de pedidos, estatísticas de faturamento e auditoria.
- **`logistica/`**: Portal Logístico. Ferramenta operacional para controle de estoque, separação de pedidos e acompanhamento de SLA de entrega.

## 🛠️ Tecnologias Principais

O ecossistema utiliza tecnologias modernas para garantir escalabilidade e manutenibilidade:

- **Backend**: Node.js com Fastify (v5+), TypeScript, Drizzle ORM e PostgreSQL.
- **Frontends**: Next.js 16 (App Router), React 19, Tailwind CSS e Shadcn/UI.
- **Autenticação**: Sistema de **Magic Link** via e-mail e tokens JWT persistidos em cookies seguros.
- **Infraestrutura**: Docker e Docker Compose para orquestração de serviços.

## 🌟 Funcionalidades de Destaque

- **Acesso Sem Senha**: Autenticação segura via e-mail, reduzindo fricção no acesso de familiares.
- **Gestão de SLA**: Monitoramento automático do prazo de entrega de 5 dias no portal logístico.
- **Validação de Receitas**: Módulo para validação de prescrições médicas junto ao CFM para medicamentos.
- **Monitoramento em Tempo Real**: Dashboard fiscal com visão geral de faturamento e status de pedidos.

## 🚀 Como Executar o Ecossistema

### Pré-requisitos

- Docker e Docker Compose instalados.
- Node.js (v20+) e NPM.

### Passos Rápidos

1. **Clonagem e Infraestrutura**:

```bash
git clone https://github.com/solucomercial/cesta-custodia.git
cd cesta-custodia
docker-compose up -d  # Sobe o banco de dados PostgreSQL
```

2. **Configuração da API**:
   Acesse a pasta `api/`, configure o `.env` seguindo o exemplo e rode as migrações do banco:

```bash
npm install
npm run db:migrate
npm run dev
```

3. **Frontends**:
   Cada frontend (`frontend/`, `fiscal/`, `logistica/`) deve ser iniciado individualmente com `npm install` e `npm run dev`.
