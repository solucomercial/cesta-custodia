# ⚖️ Cesta de Custódia - Portal de Fiscalização (SEAP)

Este é o módulo administrativo e de auditoria do ecossistema **Cesta de Custódia**. Projetado para agentes da SEAP (Secretaria de Estado de Administração Penitenciária) e administradores, o portal oferece uma visão analítica e centralizada de todas as operações financeiras e logísticas do sistema.

## ✨ Funcionalidades Principais

* **Painel de Overview (Dashboard)**:
* **Indicadores de Desempenho (KPIs)**: Visualização em tempo real do total de pedidos, pedidos pagos, pedidos pendentes e volume financeiro total movimentado.
* **Análise Geográfica**: Gráfico de barras dinâmico (Top 10) consolidando o volume de pedidos por unidade prisional, permitindo identificar áreas de maior demanda.


* **Central de Monitoramento de Pedidos**:
* **Auditoria Completa**: Listagem detalhada de todos os pedidos realizados no sistema.
* **Busca e Filtros**: Pesquisa avançada por nome do interno, número de matrícula ou filtragem por status operacional (Pendente, Pago, Entregue, etc.).
* **Modo de Leitura Estrito**: Interface desenhada para fiscalização, garantindo a integridade dos dados sem permissões de edição acidental por este perfil.


* **Gestão de Perfil**: Consulta de dados do fiscal e controle de encerramento de sessão.

## 🛠️ Tecnologias Utilizadas

A aplicação utiliza uma stack focada em visualização de dados e segurança:

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router).
* **Visualização de Dados**: [Recharts](https://recharts.org/) para gráficos interativos e responsivos.
* **Estilização**: Tailwind CSS com componentes [Shadcn/UI](https://ui.shadcn.com/) para manter a consistência visual com os demais portais.
* **Consumo de API**: [SWR](https://swr.vercel.app/) para garantir dados sempre frescos com estratégias de revalidação em segundo plano.
* **Ícones**: Lucide React.

## 🔐 Segurança e Acesso

O portal implementa um rigoroso controle de acesso baseado em funções (RBAC):

1. **Proteção via Middleware**: Todas as rotas (exceto login) são interceptadas para validar a identidade do usuário.
2. **Validação de Papel (Role)**: O acesso é concedido exclusivamente a usuários autenticados com os perfis `FISCAL_SEAP` ou `ADMIN`.
3. **Sessão Segura**: Utiliza cookies `httpOnly` para persistência do token JWT, protegendo contra ataques de XSS.

## ⚙️ Configuração e Instalação

### Pré-requisitos

* Node.js (v20 ou superior).
* Backend da API em execução.

### Passos

1. Navegue até a pasta do portal:
```bash
cd fiscal
```


2. Instale as dependências:
```bash
npm install
```


3. Configure o arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3333
API_PUBLIC_ORIGIN=http://localhost:3333
```


4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```



## 📂 Estrutura de Pastas

* `src/app/(auth)/`: Rotas de autenticação e login.
* `src/app/(portal)/`: Rotas protegidas contendo o Dashboard (`overview`) e a lista de `pedidos`.
* `src/components/ui/`: Biblioteca de componentes visuais baseada em Radix UI.
* `middleware.ts`: Lógica central de segurança e redirecionamento de perfis.
