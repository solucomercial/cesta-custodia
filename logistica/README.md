# 🚚 Cesta de Custódia - Portal de Logística

Este é o módulo operacional do ecossistema **Cesta de Custódia**, desenvolvido especificamente para atender às necessidades dos **Operadores Logísticos**. A plataforma foca na eficiência da separação de pedidos, controle rigoroso de inventário e no cumprimento dos padrões de nível de serviço (SLA).

## ✨ Funcionalidades Principais

#### **Dashboard de Pedidos Operacional**:
* **Monitoramento de Fluxo**: Visualização centralizada de todos os pedidos, ordenados pelos mais recentes.
* **Atualização de Status**: Interface direta para mover pedidos entre estados logísticos como `PREPARANDO`, `EM_TRANSITO` e `ENTREGUE`.
* **Controle de SLA**: Sistema de contagem automática de dias decorridos desde a criação do pedido. O sistema destaca visualmente (Badge Destructive) pedidos que excedem o padrão de **5 dias** sem entrega concluída.


#### **Gestão de Estoque (Inventário)**:
* **Visão Geral de Produtos**: Listagem de itens com nome, categoria e saldo atual em estoque.
* **Ajuste Rápido**: Interface via diálogo (modal) para atualização imediata da quantidade disponível de cada produto.


* **Perfil do Operador**: Consulta de dados do usuário e gestão de logout para segurança da estação de trabalho.

## 🛠️ Tecnologias Utilizadas

A aplicação utiliza uma stack moderna focada em interatividade e produtividade:

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router).
* **Linguagem**: TypeScript para garantir a integridade dos dados operacionais.
* **Estilização**: Tailwind CSS 4 com componentes [Shadcn/UI](https://ui.shadcn.com/).
* **Consumo de API**: [SWR](https://swr.vercel.app/) para atualizações de estado e revalidação de dados em tempo real.
* **Feedback ao Usuário**: [Sonner](https://www.google.com/search?q=https://unkey.com/sonner) para notificações de sucesso ou erro em operações críticas.

## 🔐 Segurança e Acesso

O portal é protegido por uma camada de segurança robusta:

1. **Middleware de Autenticação**: Intercepta todas as rotas protegidas para garantir a presença de um `auth_token` válido.
2. **Verificação de Role**: Além de estar autenticado, o sistema valida no servidor (via rota `/auth/me`) se o usuário possui estritamente o papel de **`OPERADOR`**.
3. **Redirecionamento Inteligente**: Usuários sem permissão ou não autenticados são automaticamente redirecionados para a tela de login.

## ⚙️ Configuração e Instalação

### Pré-requisitos

* Node.js (v20 ou superior).
* Backend da API em execução.

### Passos

1. Navegue até a pasta da logística:
```bash
cd logistica
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

* `src/app/(auth)/`: Processo de login e sessão.
* `src/app/(portal)/`: Dashboard principal (`page.tsx`) e página de `estoque`.
* `src/components/ui/`: Componentes base (Tabelas, Botões, Diálogos, Badges).
* `middleware.ts`: Lógica de proteção e validação de perfil `OPERADOR`.