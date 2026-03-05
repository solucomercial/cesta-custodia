"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisonUnitsRoute = void 0;
const db_1 = require("../../lib/db");
const getPrisonUnitsRoute = async (app) => {
    app.get('/prison-units', {
        schema: {
            tags: ['Prison Units'],
            summary: 'Listar unidades prisionais',
        },
    }, async () => {
        const units = await (0, db_1.sql) `
        SELECT id, nome as name, grupo_unidade as unit_group, endereco as address
        FROM unidades_prisionais
        ORDER BY nome
      `;
        return units;
    });
};
exports.getPrisonUnitsRoute = getPrisonUnitsRoute;
