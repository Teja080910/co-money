import { Controller, Delete, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { CategoryService } from '../services/CategoryService';

@Controller('api/categories')
export class CategoryController {
    private categoryService = new CategoryService();

    @Get('')
    private async list(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const shopId = typeof req.query.shopId === 'string' ? req.query.shopId : undefined;
            const categories = await this.categoryService.listCategories(authenticatedUser, shopId);
            return res.status(200).json(categories);
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

            const category = await this.categoryService.createCategory(authenticatedUser, req.body);
            return res.status(201).json(category);
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

            const category = await this.categoryService.updateCategory(authenticatedUser, req.params.id as string, req.body);
            return res.status(200).json(category);
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

            const result = await this.categoryService.deleteCategory(authenticatedUser, req.params.id as string);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
