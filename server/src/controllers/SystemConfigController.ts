import { Controller, Delete, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { SystemConfigService } from '../services/SystemConfigService';
import { getPaginationParams, paginateItems } from '../utils/pagination';

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
            const pagination = getPaginationParams(req.query);
            return res.status(200).json(
                pagination.enabled ? paginateItems(history, pagination) : history,
            );
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
            return res.status(200).json({
                ...config,
                message: 'System configuration created successfully.',
            });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Put(':id')
    private async updateEntry(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const config = await this.systemConfigService.updateConfigEntry(authenticatedUser, req.params.id as string, req.body);
            return res.status(200).json({
                ...config,
                message: 'System configuration updated successfully.',
            });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Delete(':id')
    private async remove(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const result = await this.systemConfigService.deleteConfigEntry(authenticatedUser, req.params.id as string);
            return res.status(200).json({
                ...result,
                message: 'System configuration deleted successfully.',
            });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
