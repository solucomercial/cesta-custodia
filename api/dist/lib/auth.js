"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_TOKEN_TTL_SECONDS = exports.AUTH_COOKIE_NAME = void 0;
exports.createAuthToken = createAuthToken;
exports.verifyAuthToken = verifyAuthToken;
exports.getAuthTokenFromCookieHeader = getAuthTokenFromCookieHeader;
exports.getAuthSessionFromFastifyRequest = getAuthSessionFromFastifyRequest;
exports.clearAuthCookie = clearAuthCookie;
const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 8;
exports.AUTH_COOKIE_NAME = 'auth_token';
exports.AUTH_TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? DEFAULT_TOKEN_TTL_SECONDS);
const textEncoder = new TextEncoder();
function getSecret() {
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret) {
        throw new Error('AUTH_TOKEN_SECRET obrigatorio');
    }
    return secret;
}
function base64UrlEncode(data) {
    return Buffer.from(data)
        .toString('base64')
        .replace(/=+$/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}
function base64UrlEncodeJson(payload) {
    return base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
}
function base64UrlDecode(input) {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return new Uint8Array(Buffer.from(padded, 'base64'));
}
function base64UrlDecodeJson(payload) {
    const data = base64UrlDecode(payload);
    const json = Buffer.from(data).toString('utf8');
    return JSON.parse(json);
}
async function signHmac(message, secret) {
    const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(message));
    return base64UrlEncode(new Uint8Array(signature));
}
async function verifyHmac(message, signature, secret) {
    const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, base64UrlDecode(signature), textEncoder.encode(message));
}
async function createAuthToken(payload) {
    const now = Math.floor(Date.now() / 1000);
    const body = {
        ...payload,
        iat: now,
        exp: now + exports.AUTH_TOKEN_TTL_SECONDS,
    };
    const header = base64UrlEncodeJson({ alg: 'HS256', typ: 'JWT' });
    const encodedPayload = base64UrlEncodeJson(body);
    const message = `${header}.${encodedPayload}`;
    const signature = await signHmac(message, getSecret());
    return `${message}.${signature}`;
}
async function verifyAuthToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3)
        return null;
    const [header, payload, signature] = parts;
    if (!header || !payload || !signature)
        return null;
    const isValid = await verifyHmac(`${header}.${payload}`, signature, getSecret());
    if (!isValid)
        return null;
    const data = base64UrlDecodeJson(payload);
    if (!data?.exp || data.exp < Math.floor(Date.now() / 1000)) {
        return null;
    }
    return data;
}
function getAuthTokenFromCookieHeader(cookieHeader) {
    if (!cookieHeader)
        return null;
    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const [key, ...rest] = part.trim().split('=');
        if (key === exports.AUTH_COOKIE_NAME) {
            return decodeURIComponent(rest.join('='));
        }
    }
    return null;
}
function getBearerTokenFromHeader(authorizationHeader) {
    if (!authorizationHeader)
        return null;
    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token)
        return null;
    return token;
}
async function getAuthSessionFromFastifyRequest(request) {
    const cookieToken = request.cookies?.[exports.AUTH_COOKIE_NAME];
    const headerToken = getBearerTokenFromHeader(request.headers.authorization);
    const token = cookieToken ?? headerToken ?? getAuthTokenFromCookieHeader(request.headers.cookie ?? null);
    if (!token)
        return null;
    return verifyAuthToken(token);
}
function clearAuthCookie(reply) {
    reply.clearCookie(exports.AUTH_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
}
