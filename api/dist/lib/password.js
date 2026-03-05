"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBcryptHash = isBcryptHash;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DEFAULT_BCRYPT_COST = 12;
function getBcryptCost() {
    const raw = process.env.BCRYPT_COST;
    if (!raw)
        return DEFAULT_BCRYPT_COST;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 10 || parsed > 15) {
        return DEFAULT_BCRYPT_COST;
    }
    return parsed;
}
function isBcryptHash(value) {
    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
}
async function hashPassword(plain) {
    const cost = getBcryptCost();
    return bcryptjs_1.default.hash(plain, cost);
}
async function verifyPassword(plain, hash) {
    if (!hash || !isBcryptHash(hash))
        return false;
    return bcryptjs_1.default.compare(plain, hash);
}
