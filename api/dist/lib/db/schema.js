"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsAuditoriaRelations = exports.itensPedidoRelations = exports.pedidosRelations = exports.produtosRelations = exports.internosRelations = exports.unidadesPrisionaisRelations = exports.compradoresRelations = exports.usuariosRelations = exports.logsAuditoria = exports.itensPedido = exports.pedidos = exports.produtos = exports.internos = exports.unidadesPrisionais = exports.compradores = exports.verificacoesEmail = exports.usuarios = exports.categoriaProdutoEnum = exports.statusPedidoEnum = exports.papelUsuarioEnum = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.papelUsuarioEnum = (0, pg_core_1.pgEnum)('PapelUsuario', ['ADMIN', 'FISCAL_SEAP', 'COMPRADOR', 'OPERADOR']);
exports.statusPedidoEnum = (0, pg_core_1.pgEnum)('StatusPedido', ['PENDENTE_SIPEN', 'PAGO', 'PREPARANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADO']);
exports.categoriaProdutoEnum = (0, pg_core_1.pgEnum)('CategoriaProduto', ['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO', 'MEDICAMENTOS']);
exports.usuarios = (0, pg_core_1.pgTable)('usuarios', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    senhaHash: (0, pg_core_1.text)('senha_hash').notNull(),
    papel: (0, exports.papelUsuarioEnum)('papel').notNull(),
    emailVerificadoEm: (0, pg_core_1.timestamp)('email_verificado_em'),
    smsVerificadoEm: (0, pg_core_1.timestamp)('sms_verificado_em'),
    criadoEm: (0, pg_core_1.timestamp)('criado_em').notNull().defaultNow(),
    atualizadoEm: (0, pg_core_1.timestamp)('atualizado_em').notNull().defaultNow(),
});
exports.verificacoesEmail = (0, pg_core_1.pgTable)('verificacoes_email', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.text)('email').notNull(),
    codigoHash: (0, pg_core_1.text)('codigo_hash').notNull(),
    expiraEm: (0, pg_core_1.timestamp)('expira_em').notNull(),
    tentativas: (0, pg_core_1.integer)('tentativas').notNull().default(0),
    usadoEm: (0, pg_core_1.timestamp)('usado_em'),
    criadoEm: (0, pg_core_1.timestamp)('criado_em').notNull().defaultNow(),
});
exports.compradores = (0, pg_core_1.pgTable)('compradores', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    usuarioId: (0, pg_core_1.uuid)('usuario_id').notNull().unique().references(() => exports.usuarios.id),
    nome: (0, pg_core_1.text)('nome').notNull(),
    cpf: (0, pg_core_1.text)('cpf').notNull().unique(),
    rg: (0, pg_core_1.text)('rg'),
    dataNascimento: (0, pg_core_1.date)('data_nascimento').notNull(),
    endereco: (0, pg_core_1.text)('endereco').notNull(),
    telefone: (0, pg_core_1.text)('telefone').notNull(),
    tipoProfissional: (0, pg_core_1.text)('tipo_profissional').notNull().default('OUTRO'),
    oab: (0, pg_core_1.text)('oab'),
    matriculaConsular: (0, pg_core_1.text)('matricula_consular'),
    criadoEm: (0, pg_core_1.timestamp)('criado_em').notNull().defaultNow(),
    atualizadoEm: (0, pg_core_1.timestamp)('atualizado_em').notNull().defaultNow(),
});
exports.unidadesPrisionais = (0, pg_core_1.pgTable)('unidades_prisionais', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    nome: (0, pg_core_1.text)('nome').notNull(),
    grupoUnidade: (0, pg_core_1.text)('grupo_unidade').notNull(),
    endereco: (0, pg_core_1.text)('endereco').notNull(),
    criadoEm: (0, pg_core_1.timestamp)('criado_em').notNull().defaultNow(),
    atualizadoEm: (0, pg_core_1.timestamp)('atualizado_em').notNull().defaultNow(),
});
exports.internos = (0, pg_core_1.pgTable)('internos', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    nome: (0, pg_core_1.text)('nome').notNull(),
    matricula: (0, pg_core_1.text)('matricula').notNull().unique(),
    ala: (0, pg_core_1.text)('ala').notNull(),
    cela: (0, pg_core_1.text)('cela').notNull(),
    unidadePrisionalId: (0, pg_core_1.uuid)('unidade_prisional_id').notNull().references(() => exports.unidadesPrisionais.id),
    criadoEm: (0, pg_core_1.timestamp)('criado_em').notNull().defaultNow(),
    atualizadoEm: (0, pg_core_1.timestamp)('atualizado_em').notNull().defaultNow(),
});
exports.produtos = (0, pg_core_1.pgTable)('produtos', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    nome: (0, pg_core_1.text)('nome').notNull(),
    descricao: (0, pg_core_1.text)('descricao'),
    preco: (0, pg_core_1.decimal)('preco', { precision: 10, scale: 2 }).notNull(),
    categoria: (0, exports.categoriaProdutoEnum)('categoria').notNull(),
    ativo: (0, pg_core_1.boolean)('ativo').notNull().default(true),
    quantidadeEstoque: (0, pg_core_1.integer)('quantidade_estoque').notNull().default(0),
    urlImagem: (0, pg_core_1.text)('url_imagem'),
    criadoEm: (0, pg_core_1.timestamp)('criado_em').notNull().defaultNow(),
    atualizadoEm: (0, pg_core_1.timestamp)('atualizado_em').notNull().defaultNow(),
});
exports.pedidos = (0, pg_core_1.pgTable)('pedidos', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    compradorId: (0, pg_core_1.uuid)('comprador_id').notNull().references(() => exports.compradores.id),
    internoId: (0, pg_core_1.uuid)('interno_id').references(() => exports.internos.id),
    internoNome: (0, pg_core_1.text)('interno_nome'),
    internoMatricula: (0, pg_core_1.text)('interno_matricula'),
    internoAla: (0, pg_core_1.text)('interno_ala'),
    internoCela: (0, pg_core_1.text)('interno_cela'),
    unidadePrisionalNome: (0, pg_core_1.text)('unidade_prisional_nome'),
    status: (0, exports.statusPedidoEnum)('status').notNull().default('PENDENTE_SIPEN'),
    protocoloSipen: (0, pg_core_1.text)('protocolo_sipen'),
    valorTotal: (0, pg_core_1.decimal)('valor_total', { precision: 10, scale: 2 }).notNull().default('0'),
    frete: (0, pg_core_1.decimal)('frete', { precision: 10, scale: 2 }).notNull().default('0'),
    taxaFuesp: (0, pg_core_1.decimal)('taxa_fuesp', { precision: 10, scale: 2 }).notNull().default('0'),
    urlReceita: (0, pg_core_1.text)('url_receita'),
    codigoValidacaoReceita: (0, pg_core_1.text)('codigo_validacao_receita'),
    criadoEm: (0, pg_core_1.timestamp)('criado_em').notNull().defaultNow(),
    atualizadoEm: (0, pg_core_1.timestamp)('atualizado_em').notNull().defaultNow(),
});
exports.itensPedido = (0, pg_core_1.pgTable)('itens_pedido', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    pedidoId: (0, pg_core_1.uuid)('pedido_id').notNull().references(() => exports.pedidos.id),
    produtoId: (0, pg_core_1.uuid)('produto_id').notNull().references(() => exports.produtos.id),
    quantidade: (0, pg_core_1.integer)('quantidade').notNull(),
    precoNoPedido: (0, pg_core_1.decimal)('preco_no_pedido', { precision: 10, scale: 2 }).notNull(),
});
exports.logsAuditoria = (0, pg_core_1.pgTable)('logs_auditoria', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    usuarioId: (0, pg_core_1.uuid)('usuario_id').references(() => exports.usuarios.id),
    pedidoId: (0, pg_core_1.uuid)('pedido_id').references(() => exports.pedidos.id),
    acao: (0, pg_core_1.text)('acao').notNull(),
    detalhes: (0, pg_core_1.jsonb)('detalhes').notNull().default({}),
    criadoEm: (0, pg_core_1.timestamp)('criado_em').notNull().defaultNow(),
});
exports.usuariosRelations = (0, drizzle_orm_1.relations)(exports.usuarios, ({ one, many }) => ({
    comprador: one(exports.compradores, {
        fields: [exports.usuarios.id],
        references: [exports.compradores.usuarioId],
    }),
    logs: many(exports.logsAuditoria),
}));
exports.compradoresRelations = (0, drizzle_orm_1.relations)(exports.compradores, ({ one, many }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.compradores.usuarioId],
        references: [exports.usuarios.id],
    }),
    pedidos: many(exports.pedidos),
}));
exports.unidadesPrisionaisRelations = (0, drizzle_orm_1.relations)(exports.unidadesPrisionais, ({ many }) => ({
    internos: many(exports.internos),
}));
exports.internosRelations = (0, drizzle_orm_1.relations)(exports.internos, ({ one, many }) => ({
    unidadePrisional: one(exports.unidadesPrisionais, {
        fields: [exports.internos.unidadePrisionalId],
        references: [exports.unidadesPrisionais.id],
    }),
    pedidos: many(exports.pedidos),
}));
exports.produtosRelations = (0, drizzle_orm_1.relations)(exports.produtos, ({ many }) => ({
    itensPedido: many(exports.itensPedido),
}));
exports.pedidosRelations = (0, drizzle_orm_1.relations)(exports.pedidos, ({ one, many }) => ({
    comprador: one(exports.compradores, {
        fields: [exports.pedidos.compradorId],
        references: [exports.compradores.id],
    }),
    interno: one(exports.internos, {
        fields: [exports.pedidos.internoId],
        references: [exports.internos.id],
    }),
    itens: many(exports.itensPedido),
    logs: many(exports.logsAuditoria),
}));
exports.itensPedidoRelations = (0, drizzle_orm_1.relations)(exports.itensPedido, ({ one }) => ({
    pedido: one(exports.pedidos, {
        fields: [exports.itensPedido.pedidoId],
        references: [exports.pedidos.id],
    }),
    produto: one(exports.produtos, {
        fields: [exports.itensPedido.produtoId],
        references: [exports.produtos.id],
    }),
}));
exports.logsAuditoriaRelations = (0, drizzle_orm_1.relations)(exports.logsAuditoria, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.logsAuditoria.usuarioId],
        references: [exports.usuarios.id],
    }),
    pedido: one(exports.pedidos, {
        fields: [exports.logsAuditoria.pedidoId],
        references: [exports.pedidos.id],
    }),
}));
