import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

type CepData = {
  zip_code: string
  street: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

const viaCepSchema = z.object({
  erro: z.boolean().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
  uf: z.string().optional(),
})

const brasilApiSchema = z.object({
  cep: z.string().optional(),
  street: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

const openCepSchema = z.object({
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
  uf: z.string().optional(),
})

export const getCepRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/cep/:code',
    {
      schema: {
        tags: ['CEP'],
        summary: 'Consultar CEP com fallback',
        params: z.object({
          code: z.string().regex(/^\d{8}$/, 'CEP deve conter 8 digitos numericos'),
        }),
      },
    },
    async (request, reply) => {
      const { code } = request.params

      const viaCep = await tryViaCep(code)
      if (viaCep) return viaCep

      app.log.warn(`ViaCEP falhou para o CEP ${code}, tentando Brasil API...`)
      const brasilApi = await tryBrasilApi(code)
      if (brasilApi) return brasilApi

      app.log.warn(`Brasil API falhou para o CEP ${code}, tentando OpenCEP...`)
      const openCep = await tryOpenCep(code)
      if (openCep) return openCep

      return reply.status(404).send({
        error: 'CEP não encontrado em nenhuma fonte',
      })
    },
  )
}

async function tryViaCep(cep: string): Promise<CepData | null> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data: unknown = await response.json()
    const parsed = viaCepSchema.safeParse(data)
    if (!parsed.success || parsed.data.erro) return null

    const result = parsed.data
    if (!result.cep) return null

    return {
      zip_code: String(result.cep).replace('-', ''),
      street: result.logradouro ?? '',
      complement: result.complemento ?? '',
      neighborhood: result.bairro ?? '',
      city: result.localidade ?? '',
      state: result.uf ?? '',
    }
  } catch {
    return null
  }
}

async function tryBrasilApi(cep: string): Promise<CepData | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
    if (!response.ok) return null
    const data: unknown = await response.json()
    const parsed = brasilApiSchema.safeParse(data)
    if (!parsed.success) return null

    const result = parsed.data
    if (!result.cep) return null

    return {
      zip_code: String(result.cep),
      street: result.street ?? '',
      complement: '',
      neighborhood: result.neighborhood ?? '',
      city: result.city ?? '',
      state: result.state ?? '',
    }
  } catch {
    return null
  }
}

async function tryOpenCep(cep: string): Promise<CepData | null> {
  try {
    const response = await fetch(`https://opencep.com/v1/${cep}`)
    if (!response.ok) return null
    const data: unknown = await response.json()
    const parsed = openCepSchema.safeParse(data)
    if (!parsed.success) return null

    const result = parsed.data
    if (!result.cep) return null

    return {
      zip_code: String(result.cep).replace('-', ''),
      street: result.logradouro ?? '',
      complement: result.complemento ?? '',
      neighborhood: result.bairro ?? '',
      city: result.localidade ?? '',
      state: result.uf ?? '',
    }
  } catch {
    return null
  }
}
