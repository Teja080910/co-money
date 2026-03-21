import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Shop } from '../models/Shop';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/comoney',
    synchronize: false, // We will use migrations instead
    logging: true,
    entities: [User, Shop, Wallet, WalletTransaction],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: [],
});
