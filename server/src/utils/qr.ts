import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_QR_SECRET = 'change-this-qr-secret';
const DEFAULT_QR_EXPIRY_SECONDS = 60 * 5;

type QrPayload = {
    customerId: string;
    walletId: string;
    exp: number;
};

function getQrSecret(): string {
    return process.env.QR_SECRET?.trim() || process.env.JWT_SECRET?.trim() || DEFAULT_QR_SECRET;
}

function getQrExpirySeconds(): number {
    const configuredValue = Number(process.env.QR_EXPIRES_IN_SECONDS);
    return Number.isInteger(configuredValue) && configuredValue > 0
        ? configuredValue
        : DEFAULT_QR_EXPIRY_SECONDS;
}

function toBase64Url(value: string): string {
    return Buffer.from(value, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
    const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalizedValue.length % 4 === 0 ? '' : '='.repeat(4 - (normalizedValue.length % 4));
    return Buffer.from(`${normalizedValue}${padding}`, 'base64').toString('utf8');
}

function signPayload(encodedPayload: string): string {
    return createHmac('sha256', getQrSecret()).update(encodedPayload).digest('hex');
}

export function createQrValue(customerId: string, walletId: string) {
    const payload: QrPayload = {
        customerId,
        walletId,
        exp: Math.floor(Date.now() / 1000) + getQrExpirySeconds(),
    };

    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const signature = signPayload(encodedPayload);

    return {
        qrValue: `co-money:${encodedPayload}.${signature}`,
        expiresInSeconds: getQrExpirySeconds(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
    };
}

export function verifyQrValue(qrValue: string): QrPayload | null {
    const normalizedValue = qrValue.trim();
    if (!normalizedValue.startsWith('co-money:')) {
        return null;
    }

    const token = normalizedValue.slice('co-money:'.length);
    const [encodedPayload, providedSignature] = token.split('.');
    if (!encodedPayload || !providedSignature) {
        return null;
    }

    const expectedSignature = signPayload(encodedPayload);
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
        providedBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
        return null;
    }

    try {
        const payload = JSON.parse(fromBase64Url(encodedPayload)) as QrPayload;
        if (!payload.customerId || !payload.walletId || payload.exp <= Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}
