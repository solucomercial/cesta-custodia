CREATE TYPE "public"."CategoriaProduto" AS ENUM('ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO', 'MEDICAMENTOS');--> statement-breakpoint
CREATE TYPE "public"."PapelUsuario" AS ENUM('ADMIN', 'FISCAL_SEAP', 'COMPRADOR', 'OPERADOR');--> statement-breakpoint
CREATE TYPE "public"."StatusPedido" AS ENUM('PENDENTE_SIPEN', 'PAGO', 'PREPARANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADO');--> statement-breakpoint
CREATE TABLE "compradores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cpf" text NOT NULL,
	"rg" text,
	"data_nascimento" date NOT NULL,
	"endereco" text NOT NULL,
	"telefone" text NOT NULL,
	"tipo_profissional" text DEFAULT 'OUTRO' NOT NULL,
	"oab" text,
	"matricula_consular" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compradores_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "compradores_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "internos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"matricula" text NOT NULL,
	"ala" text NOT NULL,
	"cela" text NOT NULL,
	"unidade_prisional_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "internos_matricula_unique" UNIQUE("matricula")
);
--> statement-breakpoint
CREATE TABLE "itens_pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_no_pedido" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid,
	"pedido_id" uuid,
	"acao" text NOT NULL,
	"detalhes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comprador_id" uuid NOT NULL,
	"interno_id" uuid,
	"interno_nome" text,
	"interno_matricula" text,
	"interno_ala" text,
	"interno_cela" text,
	"unidade_prisional_nome" text,
	"status" "StatusPedido" DEFAULT 'PENDENTE_SIPEN' NOT NULL,
	"protocolo_sipen" text,
	"valor_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"frete" numeric(10, 2) DEFAULT '0' NOT NULL,
	"taxa_fuesp" numeric(10, 2) DEFAULT '0' NOT NULL,
	"url_receita" text,
	"codigo_validacao_receita" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"preco" numeric(10, 2) NOT NULL,
	"categoria" "CategoriaProduto" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"quantidade_estoque" integer DEFAULT 0 NOT NULL,
	"url_imagem" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unidades_prisionais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"grupo_unidade" text NOT NULL,
	"endereco" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"papel" "PapelUsuario" NOT NULL,
	"email_verificado_em" timestamp,
	"sms_verificado_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificacoes_email" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"codigo_hash" text NOT NULL,
	"expira_em" timestamp NOT NULL,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"usado_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compradores" ADD CONSTRAINT "compradores_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internos" ADD CONSTRAINT "internos_unidade_prisional_id_unidades_prisionais_id_fk" FOREIGN KEY ("unidade_prisional_id") REFERENCES "public"."unidades_prisionais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_comprador_id_compradores_id_fk" FOREIGN KEY ("comprador_id") REFERENCES "public"."compradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_interno_id_internos_id_fk" FOREIGN KEY ("interno_id") REFERENCES "public"."internos"("id") ON DELETE no action ON UPDATE no action;