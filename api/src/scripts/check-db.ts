import { sql } from '../lib/db'

async function checkConnection() {
  // eslint-disable-next-line no-console
  console.log('🔄 Verificando conexao com o banco de dados...')

  try {
    await sql`SELECT 1`

    // eslint-disable-next-line no-console
    console.log('✅ Banco de dados conectado com sucesso!')

    await sql.end({ timeout: 5 })
    process.exit(0)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Falha ao conectar no banco de dados:')
    // eslint-disable-next-line no-console
    console.error(error)

    try {
      await sql.end({ timeout: 5 })
    } catch {
      // ignore
    }

    process.exit(1)
  }
}

checkConnection()
