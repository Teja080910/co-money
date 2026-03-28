import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Shop } from '../models/Shop';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { Promotion } from '../models/Promotion';
import { PromotionClaim } from '../models/PromotionClaim';
import { Event } from '../models/Event';
import { ShopCategory } from '../models/ShopCategory';
import { SystemConfig } from '../models/SystemConfig';
import { UserManagementAudit } from '../models/UserManagementAudit';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/comoney',
    synchronize: false, // We will use migrations instead
    migrationsRun: false,
    logging: ['error'],
    entities: [User, Shop, Wallet, WalletTransaction, Promotion, PromotionClaim, Event, ShopCategory, SystemConfig, UserManagementAudit],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: [],
});
