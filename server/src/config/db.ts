import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { AppState } from '../models/AppState';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/comoney',
    synchronize: false, // We will use migrations instead
    logging: true,
    entities: [User, AppState],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: [],
});
