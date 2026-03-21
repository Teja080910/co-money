import https from 'https';

type SendOtpEmailInput = {
    to: string;
    otp: string;
    firstName?: string | null;
};

export class EmailService {
    private readonly apiKey = process.env.RESEND_API_KEY;
    private readonly from = process.env.EMAIL_FROM;

    public isConfigured(): boolean {
        return Boolean(this.apiKey && this.from);
    }

    public async sendOtpEmail({ to, otp, firstName }: SendOtpEmailInput): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('Resend email service is not configured.');
        }

        const safeFirstName = firstName?.trim() || 'there';
        const payload = JSON.stringify({
            from: this.from,
            to: [to],
            subject: 'Your Co-Money verification code',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
                <h2 style="margin: 0 0 12px;">Verify your email</h2>
                <p style="margin: 0 0 16px;">Hello ${this.escapeHtml(safeFirstName)},</p>
                <p style="margin: 0 0 16px;">Use the OTP below to complete your Co-Money registration:</p>
                <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; margin: 20px 0; color: #f36f21;">
                  ${otp}
                </div>
                <p style="margin: 0 0 8px;">This code expires in 10 minutes.</p>
                <p style="margin: 0; color: #475569;">If you did not request this email, you can safely ignore it.</p>
              </div>
            `,
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

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
