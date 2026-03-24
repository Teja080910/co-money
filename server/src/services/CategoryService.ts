import { AppDataSource } from '../config/db';
import { UserRole } from '../constants/userRoles';
import { ShopCategory } from '../models/ShopCategory';
import { Shop } from '../models/Shop';

type CurrentUser = {
    id: string;
    role: UserRole;
};

type CategoryInput = {
    shopId?: string;
    name?: string;
    discountPercent?: number;
    isDefault?: boolean;
    isActive?: boolean;
};

export class CategoryService {
    private categoryRepository = AppDataSource.getRepository(ShopCategory);
    private shopRepository = AppDataSource.getRepository(Shop);

    public async listCategories(currentUser: CurrentUser, shopId?: string) {
        if (![UserRole.MERCHANT, UserRole.REPRESENTATIVE, UserRole.ADMIN].includes(currentUser.role)) {
            throw new Error('You do not have permission to view categories.');
        }

        const categories = await this.categoryRepository.find({
            order: { isDefault: 'DESC', name: 'ASC', createdAt: 'DESC' },
        });
        const normalizedShopId = shopId?.trim();

        const categoryEntries = await Promise.all(categories.map(async category => {
            try {
                const shop = await this.getAccessibleShop(currentUser, category.shopId);
                return { category, shop };
            } catch {
                return null;
            }
        }));

        return categoryEntries
            .filter((item): item is { category: ShopCategory; shop: Shop } => Boolean(item))
            .filter(item => !normalizedShopId || item.category.shopId === normalizedShopId)
            .map(item => ({
                ...item.category,
                shopName: item.shop.name,
            }));
    }

    public async createCategory(currentUser: CurrentUser, input: CategoryInput) {
        const shop = await this.getAccessibleShop(currentUser, input.shopId?.trim() || '');
        const name = input.name?.trim();

        if (!name) {
            throw new Error('Category name is required.');
        }

        const discountPercent = this.normalizeDiscountPercent(input.discountPercent);
        await this.ensureDefaultConstraint(shop.id, Boolean(input.isDefault));

        const category = this.categoryRepository.create({
            shopId: shop.id,
            name,
            formattedName: this.formatCategoryName(name),
            discountPercent,
            isDefault: Boolean(input.isDefault),
            isActive: input.isActive ?? true,
            createdByUserId: currentUser.id,
        });

        return this.categoryRepository.save(category);
    }

    public async updateCategory(currentUser: CurrentUser, categoryId: string, input: CategoryInput) {
        const category = await this.categoryRepository.findOneBy({ id: categoryId.trim() });
        if (!category) {
            throw new Error('Category not found.');
        }

        await this.getAccessibleShop(currentUser, category.shopId);

        if (input.name !== undefined) {
            const nextName = input.name.trim();
            if (!nextName) {
                throw new Error('Category name is required.');
            }

            category.name = nextName;
            category.formattedName = this.formatCategoryName(nextName);
        }

        if (input.discountPercent !== undefined) {
            category.discountPercent = this.normalizeDiscountPercent(input.discountPercent);
        }

        if (typeof input.isDefault === 'boolean') {
            await this.ensureDefaultConstraint(category.shopId, input.isDefault, category.id);
            category.isDefault = input.isDefault;
        }

        if (typeof input.isActive === 'boolean') {
            category.isActive = input.isActive;
        }

        return this.categoryRepository.save(category);
    }

    public async deleteCategory(currentUser: CurrentUser, categoryId: string) {
        const category = await this.categoryRepository.findOneBy({ id: categoryId.trim() });
        if (!category) {
            throw new Error('Category not found.');
        }

        await this.getAccessibleShop(currentUser, category.shopId);

        if (category.isDefault) {
            throw new Error('Default category cannot be deleted.');
        }

        await this.categoryRepository.remove(category);
        return { id: category.id };
    }

    public async getCategoryForShop(shopId: string, categoryId?: string) {
        if (categoryId?.trim()) {
            const requestedCategory = await this.categoryRepository.findOneBy({ id: categoryId.trim(), shopId });
            if (!requestedCategory || !requestedCategory.isActive) {
                throw new Error('Category not found for this shop.');
            }

            return requestedCategory;
        }

        return this.categoryRepository.findOne({
            where: { shopId, isDefault: true, isActive: true },
            order: { createdAt: 'ASC' },
        });
    }

    private async getAccessibleShop(currentUser: CurrentUser, shopId: string) {
        if (!shopId.trim()) {
            throw new Error('Shop is required.');
        }

        const shop = await this.shopRepository.findOneBy({ id: shopId.trim() });
        if (!shop) {
            throw new Error('Shop not found.');
        }

        if (currentUser.role === UserRole.MERCHANT && shop.merchantId !== currentUser.id) {
            throw new Error('You do not have permission to manage categories for this shop.');
        }

        if (currentUser.role === UserRole.REPRESENTATIVE && shop.representativeId !== currentUser.id) {
            throw new Error('You do not have permission to manage categories for this shop.');
        }

        return shop;
    }

    private async ensureDefaultConstraint(shopId: string, nextDefault: boolean, currentCategoryId?: string) {
        if (!nextDefault) {
            return;
        }

        const existingDefaultCategory = await this.categoryRepository.findOneBy({ shopId, isDefault: true });
        if (existingDefaultCategory && existingDefaultCategory.id !== currentCategoryId) {
            existingDefaultCategory.isDefault = false;
            await this.categoryRepository.save(existingDefaultCategory);
        }
    }

    private normalizeDiscountPercent(value: number | undefined) {
        if (!Number.isInteger(value) || value! < 0 || value! > 100) {
            throw new Error('Category discount percent must be between 0 and 100.');
        }

        return value!;
    }

    private formatCategoryName(value: string) {
        return value
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }
}
