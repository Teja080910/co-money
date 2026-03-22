import { Request, Response } from 'express';
import { Controller, Get, Post } from '@overnightjs/core';
import { AuthService } from '../services/AuthService';

@Controller('auth')
export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    @Post('registrazione')
    private async register(req: Request, res: Response) {
        try {
            const { firstName, lastName, email, password, username } = req.body;
            const result = await this.authService.register({
                firstName,
                lastName,
                email,
                password,
                username,
            });
            console.log('Registration result:', result);
            return res.status(201).json(result);
        } catch (error: any) {
            console.error('Registration error:', error);
            const statusCode = error.message === 'Email gia registrata.' ? 409 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    @Post('verifica-otp')
    private async verifyOtp(req: Request, res: Response) {
        try {
            const { email, otp } = req.body;
            const result = await this.authService.verifyOtp(email, otp);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('reinvia-otp')
    private async resendOtp(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const result = await this.authService.resendOtp(email);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('login')
    private async login(req: Request, res: Response) {
        try {
            const { identifier, password, domain } = req.body;
            const result = await this.authService.login(identifier, password, domain);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('change-password')
    private async changePassword(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as import('../middleware/requireRole').AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const { currentPassword, newPassword, confirmPassword } = req.body;
            const result = await this.authService.changePassword(
                authenticatedUser,
                currentPassword,
                newPassword,
                confirmPassword,
            );

            return res.status(200).json(result);
        } catch (error: any) {
            const statusCode = error.message === 'Authentication required.' ? 401 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    @Get('check-username')
    private async checkUsername(req: Request, res: Response) {
        try {
            const username = String(req.query.username || '');
            const domain = typeof req.query.domain === 'string' ? req.query.domain : undefined;
            const result = await this.authService.checkUsernameAvailability(username, domain);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
