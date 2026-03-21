import 'reflect-metadata';
import { AppServer } from './Server';
import { AppDataSource } from './config/db';

async function bootstrap() {
    try {
        await AppDataSource.initialize();
        console.log('Database connection initialized successfully.');
        const server = new AppServer();
        const port = parseInt(process.env.PORT || '5008');
        server.start(port);
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

bootstrap();
