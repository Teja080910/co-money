import express from 'express';
import { Server as OvernightServer } from '@overnightjs/core';
import { UserController } from './controllers/UserController';
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
        super.addControllers([userController]);
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    }
}
