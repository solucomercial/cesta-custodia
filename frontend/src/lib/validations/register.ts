import { z } from 'zod'

export const registerSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no minimo 3 caracteres'),
    email: z.string().email('Email invalido'),
    cpf: z.string().min(11, 'CPF invalido'),
    rg: z.string().min(5, 'RG invalido'),
    birth_date: z.string().min(1, 'Data de nascimento e obrigatoria'),
    phone: z.string().min(10, 'Telefone invalido'),
    address_street: z.string().min(1, 'Rua e obrigatoria'),
    address_number: z.string().min(1, 'Numero e obrigatorio'),
    address_complement: z.string().optional(),
    address_neighborhood: z.string().min(1, 'Bairro e obrigatorio'),
    address_city: z.string().min(1, 'Cidade e obrigatoria'),
    address_state: z.string().length(2, 'Use a sigla do estado (ex: RJ)'),
    address_zip_code: z.string().min(8, 'CEP invalido'),
    professional_type: z.enum(['ADVOGADO', 'AGENTE_CONSULAR', 'OUTRO']),
    oab_number: z.string().optional(),
    consular_registration: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.professional_type === 'ADVOGADO' && !data.oab_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Inscricao OAB obrigatoria para advogados',
        path: ['oab_number'],
      })
    }

    if (data.professional_type === 'AGENTE_CONSULAR' && !data.consular_registration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Matricula consular obrigatoria',
        path: ['consular_registration'],
      })
    }
  })

export type RegisterInput = z.infer<typeof registerSchema>
