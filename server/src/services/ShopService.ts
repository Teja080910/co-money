import { AppDataSource } from '../config/db';
import { UserRole } from '../constants/userRoles';
import { Shop } from '../models/Shop';
import { User } from '../models/User';

type CreateShopInput = {
    name: string;
    location: string;
    description?: string;
    merchantId: string;
    representativeId?: string;
};

type UpdateShopInput = {
    name?: string;
    location?: string;
    description?: string;
    merchantId?: string;
    representativeId?: string | null;
    isActive?: boolean;
};

type CurrentUser = {
    id: string;
    role: UserRole;
};

export class ShopService {
    private shopRepository = AppDataSource.getRepository(Shop);
    private userRepository = AppDataSource.getRepository(User);

    public async listShops(currentUser: CurrentUser) {
        this.assertCanViewShops(currentUser.role);

        if (currentUser.role === UserRole.MERCHANT) {
            return this.shopRepository.find({
                where: { merchantId: currentUser.id },
                order: { createdAt: 'DESC' },
            });
        }

        if (currentUser.role === UserRole.REPRESENTATIVE) {
            return this.shopRepository.find({
                where: { representativeId: currentUser.id },
                order: { createdAt: 'DESC' },
            });
        }

        return this.shopRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    public async createShop(currentUser: CurrentUser, input: CreateShopInput) {
        this.assertCanCreateShops(currentUser.role);

        const name = input.name?.trim();
        const location = input.location?.trim();
        const merchantId = input.merchantId?.trim();
        const representativeId = input.representativeId?.trim() || currentUser.id;
        const description = input.description?.trim() || null;

        if (!name) {
            throw new Error('Shop name is required.');
        }

        if (!location) {
            throw new Error('Shop location is required.');
        }

        if (!merchantId) {
            throw new Error('Merchant is required.');
        }

        const existingShop = await this.shopRepository.findOneBy({ name });
        if (existingShop) {
            throw new Error('Shop already exists.');
        }

        const merchant = await this.userRepository.findOneBy({ id: merchantId });
        if (!merchant || merchant.role !== UserRole.MERCHANT) {
            throw new Error('Merchant user not found.');
        }

        if (representativeId) {
            const representative = await this.userRepository.findOneBy({ id: representativeId });
            if (!representative || ![UserRole.REPRESENTATIVE, UserRole.ADMIN].includes(representative.role)) {
                throw new Error('Representative user not found.');
            }
        }

        const shop = this.shopRepository.create({
            name,
            location,
            description,
            merchantId,
            representativeId,
            isActive: true,
        });

        return this.shopRepository.save(shop);
    }

    public async updateShop(currentUser: CurrentUser, shopId: string, input: UpdateShopInput) {
        this.assertCanCreateShops(currentUser.role);

        const shop = await this.getManageableShop(currentUser, shopId);
        const nextName = input.name?.trim();
        const nextLocation = input.location?.trim();
        const nextDescription = input.description === undefined ? shop.description : input.description.trim() || null;
        const nextMerchantId = input.merchantId?.trim();
        const requestedRepresentativeId = typeof input.representativeId === 'string' ? input.representativeId.trim() : input.representativeId;

        if (nextName) {
            const existingShop = await this.shopRepository.findOneBy({ name: nextName });
            if (existingShop && existingShop.id !== shop.id) {
                throw new Error('Shop already exists.');
            }
            shop.name = nextName;
        }

        if (nextLocation !== undefined) {
            if (!nextLocation) {
                throw new Error('Shop location is required.');
            }
            shop.location = nextLocation;
        }

        shop.description = nextDescription;

        if (nextMerchantId) {
            const merchant = await this.userRepository.findOneBy({ id: nextMerchantId });
            if (!merchant || merchant.role !== UserRole.MERCHANT) {
                throw new Error('Merchant user not found.');
            }
            shop.merchantId = nextMerchantId;
        }

        if (currentUser.role === UserRole.ADMIN && input.representativeId !== undefined) {
            if (requestedRepresentativeId) {
                const representative = await this.userRepository.findOneBy({ id: requestedRepresentativeId });
                if (!representative || ![UserRole.REPRESENTATIVE, UserRole.ADMIN].includes(representative.role)) {
                    throw new Error('Representative user not found.');
                }
                shop.representativeId = requestedRepresentativeId;
            } else {
                shop.representativeId = null;
            }
        }

        if (typeof input.isActive === 'boolean') {
            shop.isActive = input.isActive;
        }

        return this.shopRepository.save(shop);
    }

    public async deleteShop(currentUser: CurrentUser, shopId: string) {
        this.assertCanCreateShops(currentUser.role);

        const shop = await this.getManageableShop(currentUser, shopId);
        await this.shopRepository.remove(shop);

        return { id: shopId };
    }

    private async getManageableShop(currentUser: CurrentUser, shopId: string) {
        const id = shopId.trim();
        if (!id) {
            throw new Error('Shop id is required.');
        }

        const shop = await this.shopRepository.findOneBy({ id });
        if (!shop) {
            throw new Error('Shop not found.');
        }

        if (currentUser.role === UserRole.REPRESENTATIVE && shop.representativeId !== currentUser.id) {
            throw new Error('You do not have permission to manage this shop.');
        }

        return shop;
    }

    private assertCanViewShops(role: UserRole): void {
        if (![UserRole.MERCHANT, UserRole.REPRESENTATIVE, UserRole.ADMIN].includes(role)) {
            throw new Error('You do not have permission to view shops.');
        }
    }

    private assertCanCreateShops(role: UserRole): void {
        if (![UserRole.REPRESENTATIVE, UserRole.ADMIN].includes(role)) {
            throw new Error('You do not have permission to manage shops.');
        }
    }
}
