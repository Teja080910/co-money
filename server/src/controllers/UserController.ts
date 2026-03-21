import { Request, Response } from 'express';
import { Controller, Get, Post } from '@overnightjs/core';
import { UserRole, isUserRole } from '../constants/userRoles';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { UserService } from '../services/UserService';

@Controller('api/users')
export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    @Get('')
    private async getAll(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const users = await this.userService.getAllUsers();
            return res.status(200).json(this.userService.sanitizeUsers(users));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get('customers')
    private async getCustomers(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const users = await this.userService.getUsersByRole(UserRole.CUSTOMER);
            return res.status(200).json(this.userService.sanitizeUsers(users));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get('merchants')
    private async getMerchants(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const users = await this.userService.getUsersByRole(UserRole.MERCHANT);
            return res.status(200).json(this.userService.sanitizeUsers(users));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get('representatives')
    private async getRepresentatives(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const users = await this.userService.getUsersByRole(UserRole.REPRESENTATIVE);
            return res.status(200).json(this.userService.sanitizeUsers(users));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get(':id')
    private async getById(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const userId = req.params.id as string;
            const user = await this.userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(this.userService.sanitizeUser(user));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Post('')
    private async create(req: Request, res: Response) {
        try {
            const user = await this.userService.createUser(req.body);
            return res.status(201).json(this.userService.sanitizeUser(user));
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('internal')
    private async createInternal(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const requestedRole = String(req.body.role || '').trim().toUpperCase();
            if (!isUserRole(requestedRole)) {
                return res.status(400).json({ error: 'Invalid role.' });
            }

            const user = await this.userService.createInternalUser(authenticatedUser, req.body, requestedRole as UserRole);
            return res.status(201).json(this.userService.sanitizeUser(user));
        } catch (error: any) {
            const statusCode = error.message === 'You do not have permission to create this user role.' ? 403 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }
}
