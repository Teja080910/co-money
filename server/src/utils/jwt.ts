import { createHmac, timingSafeEqual } from 'crypto';
import { UserRole } from '../constants/userRoles';

type JwtPayload = {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
};

const DEFAULT_JWT_SECRET = 'change-this-jwt-secret';
const DEFAULT_JWT_EXPIRES_IN_SECONDS = 60 * 60 * 12;

function getJwtSecret(): string {
    return process.env.JWT_SECRET?.trim() || DEFAULT_JWT_SECRET;
}

export function getJwtExpiresInSeconds(): number {
    const configuredValue = Number(process.env.JWT_EXPIRES_IN_SECONDS);
    return Number.isInteger(configuredValue) && configuredValue > 0
        ? configuredValue
        : DEFAULT_JWT_EXPIRES_IN_SECONDS;
}

function base64UrlEncode(value: string | Buffer): string {
    return Buffer.from(value)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Buffer {
    const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalizedValue.length % 4 === 0 ? '' : '='.repeat(4 - (normalizedValue.length % 4));
    return Buffer.from(`${normalizedValue}${padding}`, 'base64');
}

function signToken(unsignedToken: string): string {
    return base64UrlEncode(createHmac('sha256', getJwtSecret()).update(unsignedToken).digest());
}

export function createAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const completePayload: JwtPayload = {
        ...payload,
        iat: issuedAt,
        exp: issuedAt + getJwtExpiresInSeconds(),
    };

    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = base64UrlEncode(JSON.stringify(completePayload));
    const unsignedToken = `${header}.${encodedPayload}`;
    const signature = signToken(unsignedToken);

    return `${unsignedToken}.${signature}`;
}

export function verifyAccessToken(token: string): JwtPayload | null {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
        return null;
    }

    const [header, payload, signature] = tokenParts;
    const expectedSignature = signToken(`${header}.${payload}`);
    const providedSignatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
        providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
        !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
    ) {
        return null;
    }

    try {
        const decodedPayload = JSON.parse(base64UrlDecode(payload).toString('utf8')) as JwtPayload;
        const currentTime = Math.floor(Date.now() / 1000);

        if (!decodedPayload.sub || !decodedPayload.email || !decodedPayload.role || decodedPayload.exp <= currentTime) {
            return null;
        }

        return decodedPayload;
    } catch {
        return null;
    }
}
