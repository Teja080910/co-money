import { Controller, Delete, Get, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { PromotionService } from '../services/PromotionService';

@Controller('api/promotions')
export class PromotionController {
    private promotionService = new PromotionService();

    @Get('')
    private async list(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const promotions = await this.promotionService.listPromotions(authenticatedUser);
            return res.status(200).json(promotions);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('')
    private async create(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const promotion = await this.promotionService.createPromotion(authenticatedUser, req.body);
            return res.status(201).json(promotion);
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

            const result = await this.promotionService.deletePromotion(authenticatedUser, req.params.id as string);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
