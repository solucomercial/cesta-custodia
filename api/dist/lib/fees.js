"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRETE_FAIXAS = exports.LIMITE_SEMANAL_POR_INTERNO = exports.SALARIO_MINIMO = void 0;
exports.calcularFrete = calcularFrete;
exports.calcularFuespTax = calcularFuespTax;
exports.SALARIO_MINIMO = 1518.0;
exports.LIMITE_SEMANAL_POR_INTERNO = 1518.0;
exports.FRETE_FAIXAS = [
    { limite: 151.8, aliquota: 0.1 },
    { limite: 303.6, aliquota: 0.075 },
    { limite: 759.0, aliquota: 0.05 },
    { limite: Number.POSITIVE_INFINITY, aliquota: 0.035 },
];
function calcularFrete(valorBruto) {
    for (const faixa of exports.FRETE_FAIXAS) {
        if (valorBruto <= faixa.limite) {
            return Math.round(valorBruto * faixa.aliquota * 100) / 100;
        }
    }
    return Math.round(valorBruto * 0.035 * 100) / 100;
}
function calcularFuespTax(valorBruto) {
    return Math.round(valorBruto * 0.05 * 100) / 100;
}
