-- Cesta de Custodia SEAP/RJ - Database Schema
-- Cesta de Custódia SEAP/RJ - Esquema em Português

-- ENUMS (nomes em português)
DO $$ BEGIN
  CREATE TYPE papel_usuario AS ENUM ('ADMIN', 'FISCAL_SEAP', 'COMPRADOR', 'OPERADOR');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_pedido AS ENUM ('PENDENTE_SIPEN', 'PAGO', 'PREPARANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE categoria_produto AS ENUM ('ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO', 'MEDICAMENTOS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Função genérica para manter coluna `atualizado_em`
CREATE OR REPLACE FUNCTION atualiza_atualizado_em() RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função que recalcula o valor total do pedido a partir dos itens
CREATE OR REPLACE FUNCTION recalcula_valor_pedido() RETURNS trigger AS $$
DECLARE
  v_pedido UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_pedido := OLD.pedido_id;
  ELSE
    v_pedido := NEW.pedido_id;
  END IF;

  UPDATE pedidos
  SET valor_total = COALESCE((SELECT SUM(quantidade * preco_no_pedido)::numeric(10,2) FROM itens_pedido WHERE pedido_id = v_pedido), 0),
      atualizado_em = now()
  WHERE id = v_pedido;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  papel papel_usuario DEFAULT 'COMPRADOR' NOT NULL,
  email_verificado_em TIMESTAMPTZ,
  sms_verificado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Verificacoes de email para MFA
CREATE TABLE IF NOT EXISTS verificacoes_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  codigo_hash TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  tentativas INT NOT NULL DEFAULT 0,
  usado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verificacoes_email_email_criado_em
  ON verificacoes_email(email, criado_em DESC);

-- Tabela de compradores (dados do comprador vinculados ao usuário)
CREATE TABLE IF NOT EXISTS compradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT,
  data_nascimento DATE NOT NULL,
  endereco TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo_profissional TEXT NOT NULL DEFAULT 'OUTRO',
  oab TEXT,
  matricula_consular TEXT,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unidades prisionais
CREATE TABLE IF NOT EXISTS unidades_prisionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  grupo_unidade TEXT NOT NULL,
  endereco TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Internos
CREATE TABLE IF NOT EXISTS internos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  matricula TEXT UNIQUE NOT NULL,
  ala TEXT NOT NULL,
  cela TEXT NOT NULL,
  unidade_prisional_id UUID NOT NULL REFERENCES unidades_prisionais(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_internos_matricula ON internos(matricula);

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  categoria categoria_produto NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL,
  quantidade_estoque INT DEFAULT 0 NOT NULL,
  url_imagem TEXT,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_id UUID NOT NULL REFERENCES compradores(id),
  interno_id UUID REFERENCES internos(id),
  interno_nome TEXT,
  interno_matricula TEXT,
  interno_ala TEXT,
  interno_cela TEXT,
  unidade_prisional_nome TEXT,
  status status_pedido DEFAULT 'PENDENTE_SIPEN' NOT NULL,
  protocolo_sipen TEXT,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  frete DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxa_fuesp DECIMAL(10,2) NOT NULL DEFAULT 0,
  url_receita TEXT,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade INT NOT NULL,
  preco_no_pedido DECIMAL(10,2) NOT NULL
);

-- Logs de auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  pedido_id UUID REFERENCES pedidos(id),
  acao TEXT NOT NULL,
  detalhes JSONB NOT NULL DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_acao ON logs_auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_criado_em ON logs_auditoria(criado_em);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);

-- Triggers para atualizar `atualizado_em` automaticamente
CREATE TRIGGER trg_usuarios_atualiza_atualizado_em
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em();

CREATE TRIGGER trg_compradores_atualiza_atualizado_em
BEFORE UPDATE ON compradores
FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em();

CREATE TRIGGER trg_unidades_prisionais_atualiza_atualizado_em
BEFORE UPDATE ON unidades_prisionais
FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em();

CREATE TRIGGER trg_internos_atualiza_atualizado_em
BEFORE UPDATE ON internos
FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em();

CREATE TRIGGER trg_produtos_atualiza_atualizado_em
BEFORE UPDATE ON produtos
FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em();

CREATE TRIGGER trg_pedidos_atualiza_atualizado_em
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em();

-- Trigger para recalcular o valor do pedido quando itens mudam
CREATE TRIGGER trg_itens_pedido_recalcula_valor
AFTER INSERT OR UPDATE OR DELETE ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION recalcula_valor_pedido();

