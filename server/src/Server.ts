import express from 'express';
import { Server as OvernightServer } from '@overnightjs/core';
import cors from 'cors';
import { AuthController } from './controllers/AuthController';
import { AppController } from './controllers/AppController';

export class AppServer extends OvernightServer {
    constructor() {
        super(true);
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors());
        this.setupControllers();
    }

    private setupControllers(): void {
        super.addControllers([new AuthController(), new AppController()]);
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    }
}
