import { relations } from 'drizzle-orm'
import { boolean, date, decimal, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const papelUsuarioEnum = pgEnum('PapelUsuario', ['ADMIN', 'FISCAL_SEAP', 'COMPRADOR', 'OPERADOR'])
export const statusPedidoEnum = pgEnum('StatusPedido', ['PENDENTE_SIPEN', 'PAGO', 'PREPARANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADO'])
export const categoriaProdutoEnum = pgEnum('CategoriaProduto', ['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO', 'MEDICAMENTOS'])

export const usuarios = pgTable('usuarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  papel: papelUsuarioEnum('papel').notNull(),
  emailVerificadoEm: timestamp('email_verificado_em'),
  smsVerificadoEm: timestamp('sms_verificado_em'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
})

export const verificacoesEmail = pgTable('verificacoes_email', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  codigoHash: text('codigo_hash').notNull(),
  expiraEm: timestamp('expira_em').notNull(),
  tentativas: integer('tentativas').notNull().default(0),
  usadoEm: timestamp('usado_em'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
})

export const compradores = pgTable('compradores', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull().unique().references(() => usuarios.id),
  nome: text('nome').notNull(),
  cpf: text('cpf').notNull().unique(),
  rg: text('rg'),
  dataNascimento: date('data_nascimento').notNull(),
  endereco: text('endereco').notNull(),
  telefone: text('telefone').notNull(),
  tipoProfissional: text('tipo_profissional').notNull().default('OUTRO'),
  oab: text('oab'),
  matriculaConsular: text('matricula_consular'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
})

export const unidadesPrisionais = pgTable('unidades_prisionais', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: text('nome').notNull(),
  grupoUnidade: text('grupo_unidade').notNull(),
  endereco: text('endereco').notNull(),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
})

export const internos = pgTable('internos', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: text('nome').notNull(),
  matricula: text('matricula').notNull().unique(),
  ala: text('ala').notNull(),
  cela: text('cela').notNull(),
  unidadePrisionalId: uuid('unidade_prisional_id').notNull().references(() => unidadesPrisionais.id),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
})

export const produtos = pgTable('produtos', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  preco: decimal('preco', { precision: 10, scale: 2 }).notNull(),
  categoria: categoriaProdutoEnum('categoria').notNull(),
  ativo: boolean('ativo').notNull().default(true),
  quantidadeEstoque: integer('quantidade_estoque').notNull().default(0),
  urlImagem: text('url_imagem'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
})

export const pedidos = pgTable('pedidos', {
  id: uuid('id').defaultRandom().primaryKey(),
  compradorId: uuid('comprador_id').notNull().references(() => compradores.id),
  internoId: uuid('interno_id').references(() => internos.id),
  internoNome: text('interno_nome'),
  internoMatricula: text('interno_matricula'),
  internoAla: text('interno_ala'),
  internoCela: text('interno_cela'),
  unidadePrisionalNome: text('unidade_prisional_nome'),
  status: statusPedidoEnum('status').notNull().default('PENDENTE_SIPEN'),
  protocoloSipen: text('protocolo_sipen'),
  valorTotal: decimal('valor_total', { precision: 10, scale: 2 }).notNull().default('0'),
  frete: decimal('frete', { precision: 10, scale: 2 }).notNull().default('0'),
  taxaFuesp: decimal('taxa_fuesp', { precision: 10, scale: 2 }).notNull().default('0'),
  urlReceita: text('url_receita'),
  codigoValidacaoReceita: text('codigo_validacao_receita'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
})

export const itensPedido = pgTable('itens_pedido', {
  id: uuid('id').defaultRandom().primaryKey(),
  pedidoId: uuid('pedido_id').notNull().references(() => pedidos.id),
  produtoId: uuid('produto_id').notNull().references(() => produtos.id),
  quantidade: integer('quantidade').notNull(),
  precoNoPedido: decimal('preco_no_pedido', { precision: 10, scale: 2 }).notNull(),
})

export const logsAuditoria = pgTable('logs_auditoria', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id),
  pedidoId: uuid('pedido_id').references(() => pedidos.id),
  acao: text('acao').notNull(),
  detalhes: jsonb('detalhes').notNull().default({}),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
})

export const usuariosRelations = relations(usuarios, ({ one, many }: { one: any; many: any }) => ({
  comprador: one(compradores, {
    fields: [usuarios.id],
    references: [compradores.usuarioId],
  }),
  logs: many(logsAuditoria),
}))

export const compradoresRelations = relations(compradores, ({ one, many }: { one: any; many: any }) => ({
  usuario: one(usuarios, {
    fields: [compradores.usuarioId],
    references: [usuarios.id],
  }),
  pedidos: many(pedidos),
}))

export const unidadesPrisionaisRelations = relations(unidadesPrisionais, ({ many }: { many: any }) => ({
  internos: many(internos),
}))

export const internosRelations = relations(internos, ({ one, many }: { one: any; many: any }) => ({
  unidadePrisional: one(unidadesPrisionais, {
    fields: [internos.unidadePrisionalId],
    references: [unidadesPrisionais.id],
  }),
  pedidos: many(pedidos),
}))

export const produtosRelations = relations(produtos, ({ many }: { many: any }) => ({
  itensPedido: many(itensPedido),
}))

export const pedidosRelations = relations(pedidos, ({ one, many }: { one: any; many: any }) => ({
  comprador: one(compradores, {
    fields: [pedidos.compradorId],
    references: [compradores.id],
  }),
  interno: one(internos, {
    fields: [pedidos.internoId],
    references: [internos.id],
  }),
  itens: many(itensPedido),
  logs: many(logsAuditoria),
}))

export const itensPedidoRelations = relations(itensPedido, ({ one }: { one: any }) => ({
  pedido: one(pedidos, {
    fields: [itensPedido.pedidoId],
    references: [pedidos.id],
  }),
  produto: one(produtos, {
    fields: [itensPedido.produtoId],
    references: [produtos.id],
  }),
}))

export const logsAuditoriaRelations = relations(logsAuditoria, ({ one }: { one: any }) => ({
  usuario: one(usuarios, {
    fields: [logsAuditoria.usuarioId],
    references: [usuarios.id],
  }),
  pedido: one(pedidos, {
    fields: [logsAuditoria.pedidoId],
    references: [pedidos.id],
  }),
}))
