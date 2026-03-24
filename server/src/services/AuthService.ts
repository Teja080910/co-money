import { randomInt } from 'crypto';
import { AppDataSource } from '../config/db';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { EmailService } from './EmailService';
import { UserRole } from '../constants/userRoles';
import { hashPassword, verifyPassword } from '../utils/password';
import { createAccessToken, getJwtExpiresInSeconds } from '../utils/jwt';
import { AuthenticatedUser } from '../middleware/requireRole';
import { SystemConfigService } from './SystemConfigService';
import { WalletPointType } from '../constants/walletPointTypes';
import { WalletTransactionStatus } from '../constants/walletTransactionStatuses';
import { WalletTransactionType } from '../constants/walletTransactionTypes';

type RegisterInput = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    username?: string;
};

type AuthPayload = {
    message: string;
    email: string;
    emailVerified: boolean;
    debugOtp?: string;
};

const DEFAULT_DOMAIN = '@sottocasa.it';
const OTP_TTL_MINUTES = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
    private userRepository = AppDataSource.getRepository(User);
    private emailService = new EmailService();
    private systemConfigService = new SystemConfigService();

    public async register(input: RegisterInput): Promise<AuthPayload> {
        const firstName = this.requireValue(input.firstName, 'Inserisci il tuo nome.');
        const lastName = this.requireValue(input.lastName, 'Inserisci il tuo cognome.');
        const email = this.normalizeEmail(input.email);
        const password = this.requireValue(input.password, 'Inserisci una password.');
        const username = input.username
            ? this.normalizeUsername(input.username)
            : this.deriveUsernameFromEmail(email);

        if (!EMAIL_REGEX.test(email)) {
            throw new Error('Inserisci una email valida.');
        }

        if (password.length < 8) {
            throw new Error('La password deve essere di almeno 8 caratteri.');
        }

        const existingUser = await this.userRepository.findOneBy({ email });

        if (existingUser) {
            throw new Error('Email gia registrata.');
        }

        const verificationCode = this.generateVerificationCode();
        const user = this.userRepository.create({
            firstName,
            lastName,
            username,
            email,
            password: hashPassword(password),
            role: UserRole.CUSTOMER,
            emailVerified: false,
            verificationCode,
            verificationCodeExpiresAt: this.getOtpExpiryDate(),
        });
        
        await this.userRepository.save(user);
        await this.deliverOtpEmail(user.email, verificationCode, user.firstName);

        return {
            message: 'Registrazione completata con successo!',
            email,
            emailVerified: false,
            ...(this.getDebugOtpPayload(verificationCode)),
        };
    }

    public async verifyOtp(emailInput: string, otp: string): Promise<AuthPayload> {
        const email = this.requireValue(emailInput, 'Email richiesta.').toLowerCase();
        const normalizedOtp = this.requireValue(otp, 'Inserisci il codice OTP.');
        const user = await this.userRepository.findOneBy({ email });

        if (!user) {
            throw new Error('Utente non trovato.');
        }

        if (user.emailVerified) {
            return {
                message: 'Email gia verificata.',
                email: user.email,
                emailVerified: true,
            };
        }

        if (!user.verificationCode || !user.verificationCodeExpiresAt) {
            throw new Error('Codice OTP non disponibile.');
        }

        const isExpired = user.verificationCodeExpiresAt.getTime() < Date.now();
        if (isExpired || user.verificationCode !== normalizedOtp) {
            throw new Error('OTP non valido.');
        }

        const currentConfig = await this.systemConfigService.getCurrentConfig();

        await AppDataSource.transaction(async manager => {
            user.emailVerified = true;
            user.verificationCode = null;
            user.verificationCodeExpiresAt = null;
            await manager.save(User, user);

            if (currentConfig.welcomeBonusPoints <= 0) {
                return;
            }

            let wallet = await manager.findOneBy(Wallet, { customerId: user.id });
            if (!wallet) {
                wallet = manager.create(Wallet, {
                    customerId: user.id,
                    balance: 0,
                });
                wallet = await manager.save(Wallet, wallet);
            }

            const balanceBefore = wallet.balance;
            wallet.balance += currentConfig.welcomeBonusPoints;
            await manager.save(Wallet, wallet);

            const welcomeBonusTransaction = manager.create(WalletTransaction, {
                walletId: wallet.id,
                customerId: user.id,
                merchantId: null,
                performedByUserId: user.id,
                shopId: null,
                fromShopId: null,
                toShopId: null,
                type: WalletTransactionType.EARN,
                pointType: WalletPointType.BONUS,
                status: WalletTransactionStatus.SUCCESS,
                points: currentConfig.welcomeBonusPoints,
                purchaseAmount: null,
                discountAmount: null,
                payableAmount: null,
                earnedPoints: currentConfig.welcomeBonusPoints,
                isFirstTransactionBonus: true,
                balanceBefore,
                balanceAfter: wallet.balance,
                description: 'Welcome bonus awarded on registration',
            });

            await manager.save(WalletTransaction, welcomeBonusTransaction);
        });

        return {
            message: 'Email verificata con successo.',
            email: user.email,
            emailVerified: true,
        };
    }

    public async resendOtp(emailInput: string): Promise<AuthPayload> {
        const email = this.requireValue(emailInput, 'Email richiesta.').toLowerCase();
        const user = await this.userRepository.findOneBy({ email });

        if (!user) {
            throw new Error('Utente non trovato.');
        }

        if (user.emailVerified) {
            return {
                message: 'Email gia verificata.',
                email: user.email,
                emailVerified: true,
            };
        }

        const verificationCode = this.generateVerificationCode();
        user.verificationCode = verificationCode;
        user.verificationCodeExpiresAt = this.getOtpExpiryDate();
        await this.userRepository.save(user);
        await this.deliverOtpEmail(user.email, verificationCode, user.firstName);

        return {
            message: 'Codice OTP reinviato alla tua email.',
            email: user.email,
            emailVerified: false,
            ...(this.getDebugOtpPayload(verificationCode)),
        };
    }

    public async checkUsernameAvailability(usernameInput: string, domain?: string) {
        const username = this.normalizeUsername(usernameInput);
        if (!username) {
            throw new Error('Inserisci nome utente.');
        }
        const email = this.buildEmail(username, domain);
        const user = await this.userRepository.findOne({ where: [{ username }, { email }] });

        return {
            username,
            email,
            available: !user,
        };
    }

    public async login(identifierInput: string, password: string, domain?: string) {
        const normalizedIdentifier = this.requireValue(identifierInput, 'Inserisci nome utente o email.').toLowerCase();
        const normalizedPassword = this.requireValue(password, 'Inserisci una password.');
        const isEmailLogin = normalizedIdentifier.includes('@');
        const email = normalizedIdentifier.includes('@')
            ? normalizedIdentifier
            : this.buildEmail(normalizedIdentifier, domain);

        const user = await this.userRepository.findOneBy({ email });
        if (!user) {
            throw new Error(isEmailLogin ? 'Email non trovata.' : 'Utente non trovato.');
        }

        if (!user.isActive || user.deletedAt) {
            throw new Error('Account non attivo.');
        }

        if (!verifyPassword(normalizedPassword, user.password)) {
            throw new Error('Password non corretta.');
        }

        if (!user.emailVerified) {
            throw new Error('Verifica prima la tua email.');
        }

        return {
            message: 'Login effettuato con successo.',
            accessToken: createAccessToken({
                sub: user.id,
                email: user.email,
                role: user.role,
            }),
            tokenType: 'Bearer',
            expiresInSeconds: getJwtExpiresInSeconds(),
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
            },
        };
    }

    public async getProfile(authenticatedUser: AuthenticatedUser) {
        const user = await this.userRepository.findOneBy({ id: authenticatedUser.id });
        if (!user || !user.isActive || user.deletedAt) {
            throw new Error('Utente non trovato.');
        }

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    public async logout(_authenticatedUser: AuthenticatedUser) {
        return {
            message: 'Logout effettuato con successo.',
        };
    }

    public async changePassword(
        authenticatedUser: AuthenticatedUser,
        currentPasswordInput: string,
        newPasswordInput: string,
        confirmPasswordInput?: string,
    ) {
        const currentPassword = this.requireValue(currentPasswordInput, 'Inserisci la password attuale.');
        const newPassword = this.requireValue(newPasswordInput, 'Inserisci la nuova password.');
        const confirmPassword = this.requireValue(confirmPasswordInput || '', 'Conferma la nuova password.');

        if (newPassword.length < 8) {
            throw new Error('La nuova password deve essere di almeno 8 caratteri.');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('Le nuove password non coincidono.');
        }

        const user = await this.userRepository.findOneBy({ id: authenticatedUser.id });
        if (!user) {
            throw new Error('Utente non trovato.');
        }

        if (!verifyPassword(currentPassword, user.password)) {
            throw new Error('La password attuale non e corretta.');
        }

        user.password = hashPassword(newPassword);
        await this.userRepository.save(user);

        return {
            message: 'Password aggiornata con successo.',
        };
    }

    private normalizeUsername(username: string): string {
        return this.requireValue(username, 'Inserisci nome utente.').toLowerCase().replace(/\s+/g, '');
    }

    private normalizeEmail(email: string): string {
        return this.requireValue(email, 'Inserisci la tua email.').toLowerCase();
    }

    private deriveUsernameFromEmail(email: string): string {
        return email.split('@')[0].trim().toLowerCase();
    }

    private buildEmail(username: string, domain = DEFAULT_DOMAIN): string {
        const normalizedDomain = domain.startsWith('@') ? domain : `@${domain}`;
        return `${this.normalizeUsername(username)}${normalizedDomain.toLowerCase()}`;
    }

    private generateVerificationCode(): string {
        return randomInt(100000, 1000000).toString();
    }

    private requireValue(value: string, errorMessage: string): string {
        const normalizedValue = value?.trim();
        if (!normalizedValue) {
            throw new Error(errorMessage);
        }

        return normalizedValue;
    }

    private getOtpExpiryDate(): Date {
        return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    }

    private getDebugOtpPayload(otp: string): Pick<AuthPayload, 'debugOtp'> | {} {
        if (process.env.NODE_ENV === 'production') {
            return {};
        }

        return { debugOtp: otp };
    }

    private async deliverOtpEmail(email: string, otp: string, firstName?: string | null): Promise<void> {
        try {
            await this.emailService.sendOtpEmail({
                to: email,
                otp,
                firstName,
            });
        } catch (error) {
            console.error('Failed to send OTP email:', error);

            if (process.env.NODE_ENV === 'production') {
                throw new Error("Impossibile inviare l'email di verifica in questo momento.");
            }
        }
    }
}
