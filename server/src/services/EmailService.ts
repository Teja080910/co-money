import https from 'https';
import { UserRole } from '../constants/userRoles';

type EmailLocale = 'en' | 'it';

type SendOtpEmailInput = {
    to: string;
    otp: string;
    firstName?: string | null;
    locale?: string;
};

type SendInternalCredentialsEmailInput = {
    to: string;
    username: string;
    password: string;
    role: UserRole;
    firstName?: string | null;
    locale?: string;
};

export class EmailService {
    private readonly apiKey = process.env.RESEND_API_KEY;
    private readonly from = process.env.EMAIL_FROM;

    public isConfigured(): boolean {
        return Boolean(this.apiKey && this.from);
    }

    public async sendOtpEmail({ to, otp, firstName, locale }: SendOtpEmailInput): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('Resend email service is not configured.');
        }

        const resolvedLocale = this.resolveLocale(locale);
        const content = this.getOtpEmailContent({
            locale: resolvedLocale,
            otp,
            firstName,
        });

        await this.sendEmail({
            to,
            subject: content.subject,
            html: content.html,
        });
    }

    public async sendInternalUserCredentialsEmail({
        to,
        username,
        password,
        role,
        firstName,
        locale,
    }: SendInternalCredentialsEmailInput): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('Resend email service is not configured.');
        }

        const resolvedLocale = this.resolveLocale(locale);
        const content = this.getInternalUserCredentialsEmailContent({
            locale: resolvedLocale,
            to,
            username,
            password,
            role,
            firstName,
        });

        await this.sendEmail({
            to,
            subject: content.subject,
            html: content.html,
        });
    }

    private getOtpEmailContent({
        locale,
        otp,
        firstName,
    }: {
        locale: EmailLocale;
        otp: string;
        firstName?: string | null;
    }) {
        const safeFirstName = this.escapeHtml(firstName?.trim() || (locale === 'it' ? 'amico' : 'there'));

        if (locale === 'it') {
            return {
                subject: 'Il tuo codice di verifica Co-Money',
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
                    <h2 style="margin: 0 0 12px;">Verifica la tua email</h2>
                    <p style="margin: 0 0 16px;">Ciao ${safeFirstName},</p>
                    <p style="margin: 0 0 16px;">Usa il codice OTP qui sotto per completare la registrazione a Co-Money:</p>
                    <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; margin: 20px 0; color: #f36f21;">
                      ${otp}
                    </div>
                    <p style="margin: 0 0 8px;">Questo codice scade tra 10 minuti.</p>
                    <p style="margin: 0; color: #475569;">Se non hai richiesto questa email, puoi ignorarla tranquillamente.</p>
                  </div>
                `,
            };
        }

        return {
            subject: 'Your Co-Money verification code',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
                <h2 style="margin: 0 0 12px;">Verify your email</h2>
                <p style="margin: 0 0 16px;">Hello ${safeFirstName},</p>
                <p style="margin: 0 0 16px;">Use the OTP below to complete your Co-Money registration:</p>
                <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; margin: 20px 0; color: #f36f21;">
                  ${otp}
                </div>
                <p style="margin: 0 0 8px;">This code expires in 10 minutes.</p>
                <p style="margin: 0; color: #475569;">If you did not request this email, you can safely ignore it.</p>
              </div>
            `,
        };
    }

    private getInternalUserCredentialsEmailContent({
        locale,
        to,
        username,
        password,
        role,
        firstName,
    }: {
        locale: EmailLocale;
        to: string;
        username: string;
        password: string;
        role: UserRole;
        firstName?: string | null;
    }) {
        const safeFirstName = this.escapeHtml(firstName?.trim() || (locale === 'it' ? 'amico' : 'there'));
        const safeUsername = this.escapeHtml(username);
        const safePassword = this.escapeHtml(password);
        const safeEmail = this.escapeHtml(to);
        const safeRole = this.escapeHtml(this.humanizeRole(role, locale));

        if (locale === 'it') {
            return {
                subject: 'Credenziali del tuo account Co-Money',
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
                    <h2 style="margin: 0 0 12px;">Il tuo account e pronto</h2>
                    <p style="margin: 0 0 16px;">Ciao ${safeFirstName},</p>
                    <p style="margin: 0 0 16px;">E stato creato per te un account ${safeRole} in Co-Money.</p>
                    <div style="margin: 20px 0; padding: 18px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
                      <p style="margin: 0 0 10px;"><strong>Email:</strong> ${safeEmail}</p>
                      <p style="margin: 0 0 10px;"><strong>Nome utente:</strong> ${safeUsername}</p>
                      <p style="margin: 0;"><strong>Password temporanea:</strong> ${safePassword}</p>
                    </div>
                    <p style="margin: 0 0 8px;">Puoi accedere usando la tua email oppure il nome utente.</p>
                    <p style="margin: 0; color: #475569;">Per sicurezza, cambia la password dopo il primo accesso.</p>
                  </div>
                `,
            };
        }

        return {
            subject: 'Your Co-Money account credentials',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
                <h2 style="margin: 0 0 12px;">Your account is ready</h2>
                <p style="margin: 0 0 16px;">Hello ${safeFirstName},</p>
                <p style="margin: 0 0 16px;">A ${safeRole} account has been created for you in Co-Money.</p>
                <div style="margin: 20px 0; padding: 18px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
                  <p style="margin: 0 0 10px;"><strong>Email:</strong> ${safeEmail}</p>
                  <p style="margin: 0 0 10px;"><strong>Username:</strong> ${safeUsername}</p>
                  <p style="margin: 0;"><strong>Temporary password:</strong> ${safePassword}</p>
                </div>
                <p style="margin: 0 0 8px;">You can sign in using your email or username.</p>
                <p style="margin: 0; color: #475569;">For security, please change your password after your first login.</p>
              </div>
            `,
        };
    }

    private async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
        const payload = JSON.stringify({
            from: this.from,
            to: [to],
            subject,
            html,
        });

        await new Promise<void>((resolve, reject) => {
            const request = https.request(
                'https://api.resend.com/emails',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload),
                    },
                },
                response => {
                    let responseBody = '';

                    response.on('data', chunk => {
                        responseBody += chunk;
                    });

                    response.on('end', () => {
                        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                            resolve();
                            return;
                        }

                        reject(
                            new Error(
                                `Resend failed with status ${response.statusCode ?? 'unknown'}: ${responseBody || 'No response body'}`,
                            ),
                        );
                    });
                },
            );

            request.on('error', reject);
            request.write(payload);
            request.end();
        });
    }

    private resolveLocale(locale?: string): EmailLocale {
        if (process.env.NODE_ENV === 'production') {
            return 'it';
        }

        return locale?.trim().toLowerCase().startsWith('it') ? 'it' : 'en';
    }

    private humanizeRole(role: UserRole, locale: EmailLocale): string {
        if (locale === 'it') {
            switch (role) {
                case UserRole.ADMIN:
                    return 'admin';
                case UserRole.REPRESENTATIVE:
                    return 'rappresentante';
                case UserRole.MERCHANT:
                    return 'commerciante';
                case UserRole.CUSTOMER:
                default:
                    return 'cliente';
            }
        }

        return role.charAt(0) + role.slice(1).toLowerCase();
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
