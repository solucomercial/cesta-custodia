declare module 'drizzle-kit' {
  export function defineConfig(config: any): any
}

declare module 'drizzle-orm' {
  export const relations: any
  export const sql: any
}

declare module 'drizzle-orm/pg-core' {
  export const pgTable: any
  export const pgEnum: any
  export const uuid: any
  export const text: any
  export const timestamp: any
  export const decimal: any
  export const integer: any
  export const date: any
  export const boolean: any
  export const jsonb: any
}

declare module 'postgres' {
  interface PostgresOptions {
    ssl?: boolean | 'require' | 'no-verify'
    connect_timeout?: number
    prepare?: boolean
    onnotice?: (notice: unknown) => void
    debug?: (connection: unknown, query: string, params: unknown[]) => void
  }

  interface PostgresClient {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>
    begin<T>(fn: (tx: PostgresClient) => Promise<T>): Promise<T>
  }

  const postgres: (url: string, options?: PostgresOptions) => PostgresClient
  export default postgres
}
