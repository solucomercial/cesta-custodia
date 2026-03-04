export type PrescriptionValidationResult = {
  valid: boolean
  error?: string
  doctorName?: string
  crm?: string
  prescribedAt?: string
}

export async function validateCfmPrescription(validationCode: string): Promise<PrescriptionValidationResult> {
  if (!validationCode || validationCode.trim().length < 8) {
    return { valid: false, error: 'Codigo de validacao invalido' }
  }

  return {
    valid: true,
    doctorName: 'Dr. Exemplo de Oliveira',
    crm: '123456-SP',
    prescribedAt: new Date().toISOString(),
  }
}
