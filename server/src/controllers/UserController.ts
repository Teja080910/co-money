import { Request, Response } from 'express';
import { Controller, Get, Post } from '@overnightjs/core';
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
            const users = await this.userService.getAllUsers();
            return res.status(200).json(users);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Get(':id')
    private async getById(req: Request, res: Response) {
        try {
            const userId = req.params.id as string;
            const user = await this.userService.getUserById(userId);
            console.log(`Fetching user with ID: ${user}`);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(user);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    @Post('')
    private async create(req: Request, res: Response) {
        try {
            const user = await this.userService.createUser(req.body);
            return res.status(201).json(user);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
