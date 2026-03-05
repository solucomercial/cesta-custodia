"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCfmPrescription = validateCfmPrescription;
async function validateCfmPrescription(validationCode) {
    if (!validationCode || validationCode.trim().length < 8) {
        return { valid: false, error: 'Codigo de validacao invalido' };
    }
    return {
        valid: true,
        doctorName: 'Dr. Exemplo de Oliveira',
        crm: '123456-SP',
        prescribedAt: new Date().toISOString(),
    };
}
