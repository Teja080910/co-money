import { Request, Response } from 'express';
import { Controller, Get } from '@overnightjs/core';
import { AuthService } from '../services/AuthService';

@Controller('v1/auth')
export class LegacyAuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
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
