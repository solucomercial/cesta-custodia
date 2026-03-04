export const SALARIO_MINIMO = 1518.0
export const LIMITE_SEMANAL_POR_INTERNO = 1518.0

export const FRETE_FAIXAS = [
  { limite: 151.8, aliquota: 0.1 },
  { limite: 303.6, aliquota: 0.075 },
  { limite: 759.0, aliquota: 0.05 },
  { limite: Number.POSITIVE_INFINITY, aliquota: 0.035 },
] as const

export function calcularFrete(valorBruto: number): number {
  for (const faixa of FRETE_FAIXAS) {
    if (valorBruto <= faixa.limite) {
      return Math.round(valorBruto * faixa.aliquota * 100) / 100
    }
  }

  return Math.round(valorBruto * 0.035 * 100) / 100
}

export function calcularFuespTax(valorBruto: number): number {
  return Math.round(valorBruto * 0.05 * 100) / 100
}
