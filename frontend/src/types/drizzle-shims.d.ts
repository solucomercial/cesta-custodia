declare module 'drizzle-kit' {
  export function defineConfig<TConfig extends Record<string, unknown>>(config: TConfig): TConfig
}

declare module 'drizzle-orm' {
  export type SQL = {
    readonly _tag: 'drizzle-sql'
    readonly strings: readonly string[]
    readonly values: readonly unknown[]
  }

  export const relations: unknown
  export function sql(strings: TemplateStringsArray, ...values: unknown[]): SQL
}

declare module 'drizzle-orm/pg-core' {
  export const pgTable: (...args: unknown[]) => unknown
  export const pgEnum: (...args: unknown[]) => unknown
  export const uuid: (...args: unknown[]) => unknown
  export const text: (...args: unknown[]) => unknown
  export const timestamp: (...args: unknown[]) => unknown
  export const decimal: (...args: unknown[]) => unknown
  export const integer: (...args: unknown[]) => unknown
  export const date: (...args: unknown[]) => unknown
  export const boolean: (...args: unknown[]) => unknown
  export const jsonb: (...args: unknown[]) => unknown
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
