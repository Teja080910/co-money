import { AppDataSource } from '../config/db';
import { UserRole } from '../constants/userRoles';
import { SystemConfig } from '../models/SystemConfig';

type CurrentUser = {
    id: string;
    role: UserRole;
};

type SystemConfigInput = {
    welcomeBonusPoints?: number;
    pointExpirationDays?: number;
    maxPointsPerTransaction?: number;
    defaultMaxDiscountPercent?: number;
    changeReason?: string;
};

const DEFAULT_SYSTEM_CONFIG = {
    version: 0,
    welcomeBonusPoints: 10,
    pointExpirationDays: 365,
    maxPointsPerTransaction: 1000,
    defaultMaxDiscountPercent: 30,
    updatedByUserId: '',
    changeReason: null,
    createdAt: new Date(0),
};

export class SystemConfigService {
    private systemConfigRepository = AppDataSource.getRepository(SystemConfig);

    public async getCurrentConfig() {
        const latestConfig = await this.systemConfigRepository.find({
            order: { version: 'DESC', createdAt: 'DESC' },
            take: 1,
        });

        return latestConfig[0] ?? DEFAULT_SYSTEM_CONFIG;
    }

    public async updateConfig(currentUser: CurrentUser, input: SystemConfigInput) {
        if (currentUser.role !== UserRole.ADMIN) {
            throw new Error('You do not have permission to manage system configuration.');
        }

        const currentConfig = await this.getCurrentConfig();
        const nextConfig = this.systemConfigRepository.create({
            version: currentConfig.version + 1,
            welcomeBonusPoints: this.normalizeInteger(input.welcomeBonusPoints, currentConfig.welcomeBonusPoints, 'Welcome bonus points must be a non-negative integer.'),
            pointExpirationDays: this.normalizeInteger(input.pointExpirationDays, currentConfig.pointExpirationDays, 'Point expiration days must be a positive integer.', 1),
            maxPointsPerTransaction: this.normalizeInteger(input.maxPointsPerTransaction, currentConfig.maxPointsPerTransaction, 'Max points per transaction must be a positive integer.', 1),
            defaultMaxDiscountPercent: this.normalizePercentage(input.defaultMaxDiscountPercent, currentConfig.defaultMaxDiscountPercent),
            updatedByUserId: currentUser.id,
            changeReason: input.changeReason?.trim() || null,
        });

        return this.systemConfigRepository.save(nextConfig);
    }

    public async getConfigHistory(currentUser: CurrentUser) {
        if (currentUser.role !== UserRole.ADMIN) {
            throw new Error('You do not have permission to manage system configuration.');
        }

        return this.systemConfigRepository.find({
            order: { version: 'DESC', createdAt: 'DESC' },
        });
    }

    private normalizeInteger(value: number | undefined, fallback: number, errorMessage: string, min = 0) {
        if (value === undefined || value === null) {
            return fallback;
        }

        if (!Number.isInteger(value) || value < min) {
            throw new Error(errorMessage);
        }

        return value;
    }

    private normalizePercentage(value: number | undefined, fallback: number) {
        if (value === undefined || value === null) {
            return fallback;
        }

        if (!Number.isInteger(value) || value < 0 || value > 100) {
            throw new Error('Default max discount percent must be between 0 and 100.');
        }

        return value;
    }
}
