import express from 'express';
import { Server as OvernightServer } from '@overnightjs/core';
import { UserController } from './controllers/UserController';
import { AuthController } from './controllers/AuthController';
import { LegacyAuthController } from './controllers/LegacyAuthController';
import cors from 'cors';

export class AppServer extends OvernightServer {
    constructor() {
        super(true);
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors());
        this.setupControllers();
    }

    private setupControllers(): void {
        const userController = new UserController();
        const authController = new AuthController();
        const legacyAuthController = new LegacyAuthController();
        super.addControllers([userController, authController, legacyAuthController]);
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    }
}
