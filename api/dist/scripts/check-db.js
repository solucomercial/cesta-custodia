"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../lib/db");
async function checkConnection() {
    // eslint-disable-next-line no-console
    console.log('🔄 Verificando conexao com o banco de dados...');
    try {
        await (0, db_1.sql) `SELECT 1`;
        // eslint-disable-next-line no-console
        console.log('✅ Banco de dados conectado com sucesso!');
        await db_1.sql.end({ timeout: 5 });
        process.exit(0);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Falha ao conectar no banco de dados:');
        // eslint-disable-next-line no-console
        console.error(error);
        try {
            await db_1.sql.end({ timeout: 5 });
        }
        catch {
            // ignore
        }
        process.exit(1);
    }
}
checkConnection();
