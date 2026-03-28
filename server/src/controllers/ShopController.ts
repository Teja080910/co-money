import { Controller, Delete, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { ShopService } from '../services/ShopService';
import { getPaginationParams, paginateItems } from '../utils/pagination';

@Controller('api/shops')
export class ShopController {
    private shopService = new ShopService();

    @Get('')
    private async list(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const shops = await this.shopService.listShops(authenticatedUser);
            const pagination = getPaginationParams(req.query);
            return res.status(200).json(
                pagination.enabled ? paginateItems(shops, pagination) : shops,
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

            const shop = await this.shopService.createShop(authenticatedUser, req.body);
            return res.status(201).json(shop);
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

            const shop = await this.shopService.updateShop(authenticatedUser, req.params.id as string, req.body);
            return res.status(200).json(shop);
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

            const result = await this.shopService.deleteShop(authenticatedUser, req.params.id as string);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
