import { Controller, Delete, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { PromotionService } from '../services/PromotionService';
import { getPaginationParams, paginateItems } from '../utils/pagination';

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
            const pagination = getPaginationParams(req.query);
            return res.status(200).json(
                pagination.enabled ? paginateItems(promotions, pagination) : promotions,
            );
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

    @Put(':id')
    private async update(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const promotion = await this.promotionService.updatePromotion(authenticatedUser, req.params.id as string, req.body);
            return res.status(200).json(promotion);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post(':id/claim')
    private async claim(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const result = await this.promotionService.claimPromotion(authenticatedUser, req.params.id as string);
            return res.status(200).json(result);
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
