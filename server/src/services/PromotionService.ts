import { AppDataSource } from '../config/db';
import { UserRole } from '../constants/userRoles';
import { Promotion } from '../models/Promotion';
import { Shop } from '../models/Shop';

type CurrentUser = {
    id: string;
    role: UserRole;
};

type PromotionInput = {
    title?: string;
    description?: string;
    shopId?: string;
    bonusPoints?: number;
    maxDiscountPercent?: number;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
};

export class PromotionService {
    private promotionRepository = AppDataSource.getRepository(Promotion);
    private shopRepository = AppDataSource.getRepository(Shop);

    public async listPromotions(currentUser: CurrentUser) {
        const promotions = await this.promotionRepository.find({
            order: { startsAt: 'ASC', createdAt: 'DESC' },
        });
        const shops = await this.shopRepository.find();
        const shopMap = new Map(shops.map(shop => [shop.id, shop]));
        const now = new Date();

        return promotions
            .filter(promotion => {
                if (currentUser.role === UserRole.CUSTOMER) {
                    return promotion.isActive && promotion.endsAt >= now;
                }

                if (currentUser.role === UserRole.MERCHANT) {
                    return promotion.merchantId === currentUser.id;
                }

                return true;
            })
            .map(promotion => ({
                ...promotion,
                shopName: shopMap.get(promotion.shopId)?.name || 'Unknown shop',
                shopLocation: shopMap.get(promotion.shopId)?.location || '',
            }));
    }

    public async createPromotion(currentUser: CurrentUser, input: PromotionInput) {
        this.assertCanManagePromotions(currentUser.role);

        const title = input.title?.trim();
        const shopId = input.shopId?.trim();
        const startsAt = this.parseDate(input.startsAt, 'Promotion start date is required.');
        const endsAt = this.parseDate(input.endsAt, 'Promotion end date is required.');

        if (!title) {
            throw new Error('Promotion title is required.');
        }

        if (!shopId) {
            throw new Error('Shop is required.');
        }

        if (endsAt < startsAt) {
            throw new Error('Promotion end date must be after the start date.');
        }

        const shop = await this.getManageableShop(currentUser, shopId);
        const promotion = this.promotionRepository.create({
            title,
            description: input.description?.trim() || null,
            shopId: shop.id,
            merchantId: shop.merchantId,
            bonusPoints: this.normalizeNonNegativeInteger(input.bonusPoints, 0),
            maxDiscountPercent: this.normalizePercentage(input.maxDiscountPercent, 30),
            startsAt,
            endsAt,
            isActive: input.isActive ?? true,
        });

        return this.promotionRepository.save(promotion);
    }

    public async deletePromotion(currentUser: CurrentUser, promotionId: string) {
        this.assertCanManagePromotions(currentUser.role);

        const promotion = await this.promotionRepository.findOneBy({ id: promotionId.trim() });
        if (!promotion) {
            throw new Error('Promotion not found.');
        }

        await this.getManageableShop(currentUser, promotion.shopId);
        await this.promotionRepository.remove(promotion);

        return { id: promotion.id };
    }

    private async getManageableShop(currentUser: CurrentUser, shopId: string) {
        const shop = await this.shopRepository.findOneBy({ id: shopId });
        if (!shop) {
            throw new Error('Shop not found.');
        }

        if (currentUser.role === UserRole.MERCHANT && shop.merchantId !== currentUser.id) {
            throw new Error('You do not have permission to manage promotions for this shop.');
        }

        if (currentUser.role === UserRole.REPRESENTATIVE && shop.representativeId !== currentUser.id) {
            throw new Error('You do not have permission to manage promotions for this shop.');
        }

        return shop;
    }

    private assertCanManagePromotions(role: UserRole) {
        if (![UserRole.MERCHANT, UserRole.REPRESENTATIVE, UserRole.ADMIN].includes(role)) {
            throw new Error('You do not have permission to manage promotions.');
        }
    }

    private parseDate(value: string | undefined, errorMessage: string): Date {
        const parsed = value ? new Date(value) : null;
        if (!parsed || Number.isNaN(parsed.getTime())) {
            throw new Error(errorMessage);
        }

        return parsed;
    }

    private normalizeNonNegativeInteger(value: number | undefined, fallback: number) {
        if (value === undefined || value === null || value === Number.NaN) {
            return fallback;
        }

        if (!Number.isInteger(value) || value < 0) {
            throw new Error('Bonus points must be a non-negative integer.');
        }

        return value;
    }

    private normalizePercentage(value: number | undefined, fallback: number) {
        if (value === undefined || value === null || value === Number.NaN) {
            return fallback;
        }

        if (!Number.isInteger(value) || value < 0 || value > 100) {
            throw new Error('Max discount percent must be between 0 and 100.');
        }

        return value;
    }
}
