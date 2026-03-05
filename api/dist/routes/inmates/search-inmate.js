"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchInmateRoute = void 0;
const zod_1 = require("zod");
const db_1 = require("../../lib/db");
const searchInmateRoute = async (app) => {
    app.get('/inmates/search', {
        schema: {
            tags: ['Inmates'],
            summary: 'Buscar interno por matrícula',
            querystring: zod_1.z.object({
                registration: zod_1.z.string().min(1),
            }),
            response: {
                200: zod_1.z.object({
                    id: zod_1.z.string().uuid(),
                    name: zod_1.z.string(),
                    registration: zod_1.z.string(),
                    ward: zod_1.z.string(),
                    cell: zod_1.z.string(),
                    prison_unit_id: zod_1.z.string().uuid(),
                    prison_unit_name: zod_1.z.string(),
                }),
                400: zod_1.z.object({ error: zod_1.z.string() }),
                404: zod_1.z.object({ error: zod_1.z.string() }),
            },
        },
    }, async (request, reply) => {
        const { registration } = request.query;
        if (!registration) {
            return reply.code(400).send({ error: 'Matricula obrigatoria' });
        }
        const inmates = await (0, db_1.sql) `
        SELECT i.id,
          i.nome as name,
          i.matricula as registration,
          i.ala as ward,
          i.cela as cell,
          i.unidade_prisional_id as prison_unit_id,
          pu.nome as prison_unit_name
        FROM internos i
        JOIN unidades_prisionais pu ON i.unidade_prisional_id = pu.id
        WHERE i.matricula = ${registration}
      `;
        if (inmates.length === 0) {
            return reply.code(404).send({ error: 'Interno nao encontrado' });
        }
        const inmate = inmates[0];
        return {
            id: inmate.id,
            name: inmate.name,
            registration: inmate.registration,
            ward: inmate.ward,
            cell: inmate.cell,
            prison_unit_id: inmate.prison_unit_id,
            prison_unit_name: inmate.prison_unit_name,
        };
    });
};
exports.searchInmateRoute = searchInmateRoute;
