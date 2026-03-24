import { Controller, Get, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { SystemConfigService } from '../services/SystemConfigService';

@Controller('api/system-config')
export class SystemConfigController {
    private systemConfigService = new SystemConfigService();

    @Get('')
    private async getCurrent(req: Request, res: Response) {
        try {
            const currentConfig = await this.systemConfigService.getCurrentConfig();
            return res.status(200).json(currentConfig);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Get('history')
    private async getHistory(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const history = await this.systemConfigService.getConfigHistory(authenticatedUser);
            return res.status(200).json(history);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('')
    private async update(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const config = await this.systemConfigService.updateConfig(authenticatedUser, req.body);
            return res.status(200).json(config);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
