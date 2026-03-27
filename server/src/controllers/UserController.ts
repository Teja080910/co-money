import { Request, Response } from 'express';
import { Controller, Get, Post } from '@overnightjs/core';
import { UserRole, isUserRole } from '../constants/userRoles';
import { getAuthenticatedUser } from '../middleware/requireRole';
import { UserService } from '../services/UserService';
import { getPaginationParams, paginateItems } from '../utils/pagination';

@Controller('api/users')
export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    @Get('')
    private async getAll(req: Request, res: Response) {
        try {
            const authenticatedUser = getAuthenticatedUser(req, res, UserRole.ADMIN);
            if (!authenticatedUser) {
                return;
            }

            const role = typeof req.query.role === 'string' && isUserRole(req.query.role.trim().toUpperCase())
                ? req.query.role.trim().toUpperCase() as UserRole
                : undefined;
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const users = await this.userService.getAllUsers({ role, status });
            const sanitizedUsers = this.userService.sanitizeUsers(users);
            const pagination = getPaginationParams(req.query);

            return res.status(200).json(
                pagination.enabled ? paginateItems(sanitizedUsers, pagination) : sanitizedUsers,
            );
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get('customers')
    private async getCustomers(req: Request, res: Response) {
        try {
            const authenticatedUser = getAuthenticatedUser(
                req,
                res,
                UserRole.MERCHANT,
                UserRole.REPRESENTATIVE,
                UserRole.ADMIN,
            );
            if (!authenticatedUser) {
                return;
            }

            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const users = await this.userService.getAllUsers({ role: UserRole.CUSTOMER, status });
            const sanitizedUsers = this.userService.sanitizeUsers(users);
            const pagination = getPaginationParams(req.query);

            return res.status(200).json(
                pagination.enabled ? paginateItems(sanitizedUsers, pagination) : sanitizedUsers,
            );
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get('merchants')
    private async getMerchants(req: Request, res: Response) {
        try {
            const authenticatedUser = getAuthenticatedUser(req, res, UserRole.REPRESENTATIVE, UserRole.ADMIN);
            if (!authenticatedUser) {
                return;
            }

            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const users = await this.userService.getAllUsers({ role: UserRole.MERCHANT, status });
            const sanitizedUsers = this.userService.sanitizeUsers(users);
            const pagination = getPaginationParams(req.query);

            return res.status(200).json(
                pagination.enabled ? paginateItems(sanitizedUsers, pagination) : sanitizedUsers,
            );
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get('representatives')
    private async getRepresentatives(req: Request, res: Response) {
        try {
            const authenticatedUser = getAuthenticatedUser(req, res, UserRole.ADMIN);
            if (!authenticatedUser) {
                return;
            }

            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const users = await this.userService.getAllUsers({ role: UserRole.REPRESENTATIVE, status });
            const sanitizedUsers = this.userService.sanitizeUsers(users);
            const pagination = getPaginationParams(req.query);

            return res.status(200).json(
                pagination.enabled ? paginateItems(sanitizedUsers, pagination) : sanitizedUsers,
            );
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get(':id')
    private async getById(req: Request, res: Response) {
        try {
            const authenticatedUser = getAuthenticatedUser(
                req,
                res,
                UserRole.CUSTOMER,
                UserRole.MERCHANT,
                UserRole.REPRESENTATIVE,
                UserRole.ADMIN,
            );
            if (!authenticatedUser) {
                return;
            }

            const userId = req.params.id as string;
            const isSelf = authenticatedUser.id === userId;
            const canInspectOthers =
                authenticatedUser.role === UserRole.ADMIN || authenticatedUser.role === UserRole.REPRESENTATIVE;

            if (!isSelf && !canInspectOthers) {
                return res.status(403).json({ error: 'Insufficient permissions.' });
            }

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
            const authenticatedUser = getAuthenticatedUser(req, res, UserRole.REPRESENTATIVE, UserRole.ADMIN);
            if (!authenticatedUser) {
                return;
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

    @Post(':id/activate')
    private async activate(req: Request, res: Response) {
        try {
            const authenticatedUser = getAuthenticatedUser(req, res, UserRole.ADMIN);
            if (!authenticatedUser) {
                return;
            }

            const user = await this.userService.activateUser(authenticatedUser, req.params.id as string, req.body.reason);
            return res.status(200).json(user);
        } catch (error: any) {
            const statusCode = error.message === 'User not found.' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    @Post(':id/deactivate')
    private async deactivate(req: Request, res: Response) {
        try {
            const authenticatedUser = getAuthenticatedUser(req, res, UserRole.ADMIN);
            if (!authenticatedUser) {
                return;
            }

            const user = await this.userService.deactivateUser(authenticatedUser, req.params.id as string, req.body.reason);
            return res.status(200).json(user);
        } catch (error: any) {
            const statusCode = error.message === 'User not found.' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    @Post(':id/delete')
    private async remove(req: Request, res: Response) {
        try {
            const authenticatedUser = getAuthenticatedUser(req, res, UserRole.ADMIN);
            if (!authenticatedUser) {
                return;
            }

            const user = await this.userService.deleteUser(authenticatedUser, req.params.id as string, req.body.reason);
            return res.status(200).json(user);
        } catch (error: any) {
            const statusCode = error.message === 'User not found.' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }
}
