import express from 'express';
import { Server as OvernightServer } from '@overnightjs/core';
import { UserController } from './controllers/UserController';
import { AuthController } from './controllers/AuthController';
import { LegacyAuthController } from './controllers/LegacyAuthController';
import { WalletController } from './controllers/WalletController';
import { ShopController } from './controllers/ShopController';
import { PromotionController } from './controllers/PromotionController';
import { EventController } from './controllers/EventController';
import { CategoryController } from './controllers/CategoryController';
import { SystemConfigController } from './controllers/SystemConfigController';
import cors from 'cors';
import { attachAuthenticatedUser } from './middleware/attachAuthenticatedUser';

export class AppServer extends OvernightServer {
    constructor() {
        super(true);
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors());
        this.app.use(attachAuthenticatedUser);
        this.setupControllers();
    }

    private setupControllers(): void {
        const userController = new UserController();
        const authController = new AuthController();
        const legacyAuthController = new LegacyAuthController();
        const walletController = new WalletController();
        const shopController = new ShopController();
        const promotionController = new PromotionController();
        const eventController = new EventController();
        const categoryController = new CategoryController();
        const systemConfigController = new SystemConfigController();
        super.addControllers([
            userController,
            authController,
            legacyAuthController,
            walletController,
            shopController,
            promotionController,
            eventController,
            categoryController,
            systemConfigController,
        ]);
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    }
}
