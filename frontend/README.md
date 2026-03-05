# 🛍️ Cesta de Custódia - Portal do Comprador

Esta é a interface principal do ecossistema **Cesta de Custódia**, desenvolvida para permitir que familiares, advogados e representantes consulares adquiram itens essenciais para internos do sistema prisional de forma ágil, segura e transparente.

## ✨ Funcionalidades Principais

* **Autenticação Sem Senha (Magic Link)**: Acesso seguro e simplificado utilizando apenas CPF, OAB ou Matrícula Consular, com link de validação enviado por e-mail.
* **Catálogo de Produtos Inteligente**: Visualização de itens divididos por categorias como Alimentos, Higiene, Vestuário e Medicamentos.
* **Carrinho de Compras Dinâmico**: Gerenciamento de itens em tempo real com barra lateral de fácil acesso.
* **Checkout Estruturado**: Processo de finalização de pedido integrado com busca de internos e unidades prisionais.
* **Histórico de Pedidos**: Acompanhamento detalhado do status de cada pedido realizado (Pendente, Pago, Em Trânsito, etc.).
* **Gestão de Perfil**: Visualização dos dados cadastrais e controle de sessão do usuário.

## 🛠️ Tecnologias Utilizadas

A aplicação utiliza as ferramentas mais modernas do ecossistema React para oferecer uma experiência de SPA (Single Page Application) fluida:

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router).
* **Linguagem**: TypeScript para máxima segurança e produtividade.
* **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/) com componentes [Shadcn/UI](https://ui.shadcn.com/).
* **Gerenciamento de Estado**: Hooks customizados e persistência local para o carrinho de compras.
* **Consumo de API**: [SWR](https://swr.vercel.app/) para data fetching com cache e revalidação automática.
* **Validação de Formulários**: [React Hook Form](https://react-hook-form.com/) integrado com [Zod](https://zod.dev/).

## 🔐 Fluxo de Autenticação

O portal utiliza uma estratégia híbrida para garantir segurança e persistência:

1. O usuário solicita um **Magic Link** informando seu identificador.
2. Após clicar no link enviado por e-mail, a API redireciona o usuário para o frontend passando um token no fragmento da URL (`#token=...`).
3. O componente de login captura esse token, persiste-o via rota interna de sessão (`/api/auth/session`) em cookies seguros e sincroniza com o `localStorage` para chamadas de API.
4. O **Middleware** do Next.js monitora o cookie `auth_token` para proteger as rotas de catálogo e pedidos.

## ⚙️ Configuração e Instalação

### Pré-requisitos

* Node.js (v20 ou superior).
* API do backend em execução.

### Passos

1. Navegue até a pasta do frontend:
```bash
cd frontend
```


2. Instale as dependências:
```bash
npm install
```


3. Configure o arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```


4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```



## 📂 Estrutura de Pastas

* `src/app/`: Contém as rotas e páginas da aplicação (App Router).
* `src/components/`: Componentes de interface reutilizáveis e elementos da UI.
* `src/lib/`: Utilitários de autenticação, validação, temas e gerenciamento de estado.
* `src/services/`: Configuração da instância de comunicação com a API backend.