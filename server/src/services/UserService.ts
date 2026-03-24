import { AppDataSource } from '../config/db';
import { UserRole } from '../constants/userRoles';
import { User } from '../models/User';
import { UserManagementAudit } from '../models/UserManagementAudit';
import { hashPassword } from '../utils/password';
import { AuthenticatedUser } from '../middleware/requireRole';

const MANAGEABLE_ROLES_BY_ACTOR: Record<UserRole, UserRole[]> = {
    [UserRole.ADMIN]: [UserRole.REPRESENTATIVE, UserRole.MERCHANT, UserRole.CUSTOMER],
    [UserRole.REPRESENTATIVE]: [UserRole.MERCHANT, UserRole.CUSTOMER],
    [UserRole.MERCHANT]: [],
    [UserRole.CUSTOMER]: [],
};

export class UserService {
    private userRepository = AppDataSource.getRepository(User);
    private userManagementAuditRepository = AppDataSource.getRepository(UserManagementAudit);

    public async getAllUsers(filters?: { role?: UserRole; status?: string }): Promise<User[]> {
        const users = await this.userRepository.find({
            order: { createdAt: 'DESC' },
        });

        return users.filter(user => {
            const matchesRole = filters?.role ? user.role === filters.role : true;
            const matchesStatus = this.matchesStatus(user, filters?.status);
            return matchesRole && matchesStatus;
        });
    }

    public async getUserById(id: string): Promise<User | null> {
        return await this.userRepository.findOneBy({ id });
    }

    public async getUsersByRole(role: UserRole): Promise<User[]> {
        return this.userRepository.find({
            where: { role },
            order: { createdAt: 'DESC' },
        });
    }

    public async createUser(userData: Partial<User>, role: UserRole = UserRole.CUSTOMER): Promise<User> {
        const email = userData.email?.trim().toLowerCase();
        const username = userData.username?.trim().toLowerCase();
        const password = userData.password?.trim();

        if (!email) {
            throw new Error('Email is required.');
        }

        if (!username) {
            throw new Error('Username is required.');
        }

        if (!password) {
            throw new Error('Password is required.');
        }

        const existingUser = await this.userRepository.findOneBy({ email });
        if (existingUser) {
            throw new Error('Email already registered.');
        }

        const user = this.userRepository.create({
            ...userData,
            email,
            username,
            password: hashPassword(password),
            role,
            isActive: true,
            deactivatedAt: null,
            deletedAt: null,
        });

        return await this.userRepository.save(user);
    }

    public async createInternalUser(actor: AuthenticatedUser, userData: Partial<User>, role: UserRole): Promise<User> {
        if (!MANAGEABLE_ROLES_BY_ACTOR[actor.role].includes(role)) {
            throw new Error('You do not have permission to create this user role.');
        }

        return this.createUser(userData, role);
    }

    public sanitizeUser(user: User) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            deactivatedAt: user.deactivatedAt,
            deletedAt: user.deletedAt,
            status: this.getUserStatus(user),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    public sanitizeUsers(users: User[]) {
        return users.map(user => this.sanitizeUser(user));
    }

    public async activateUser(actor: AuthenticatedUser, userId: string, reason?: string) {
        const user = await this.requireManageableExistingUser(actor, userId);
        user.isActive = true;
        user.deactivatedAt = null;

        await this.userRepository.save(user);
        await this.recordAudit(actor, user, 'ACTIVATE', reason);

        return this.sanitizeUser(user);
    }

    public async deactivateUser(actor: AuthenticatedUser, userId: string, reason?: string) {
        const user = await this.requireManageableExistingUser(actor, userId);

        if (user.deletedAt) {
            throw new Error('Deleted users cannot be deactivated.');
        }

        user.isActive = false;
        user.deactivatedAt = new Date();

        await this.userRepository.save(user);
        await this.recordAudit(actor, user, 'DEACTIVATE', reason);

        return this.sanitizeUser(user);
    }

    public async deleteUser(actor: AuthenticatedUser, userId: string, reason?: string) {
        const user = await this.requireManageableExistingUser(actor, userId);

        user.isActive = false;
        user.deactivatedAt = user.deactivatedAt ?? new Date();
        user.deletedAt = new Date();

        await this.userRepository.save(user);
        await this.recordAudit(actor, user, 'DELETE', reason);

        return this.sanitizeUser(user);
    }

    private async requireManageableExistingUser(actor: AuthenticatedUser, userId: string): Promise<User> {
        const trimmedUserId = userId.trim();
        if (!trimmedUserId) {
            throw new Error('User id is required.');
        }

        if (actor.id === trimmedUserId) {
            throw new Error('You cannot manage your own account lifecycle.');
        }

        const user = await this.userRepository.findOneBy({ id: trimmedUserId });
        if (!user) {
            throw new Error('User not found.');
        }

        if (!MANAGEABLE_ROLES_BY_ACTOR[actor.role].includes(user.role)) {
            throw new Error('You do not have permission to manage this user.');
        }

        return user;
    }

    private async recordAudit(actor: AuthenticatedUser, target: User, action: string, reason?: string) {
        const audit = this.userManagementAuditRepository.create({
            actorUserId: actor.id,
            targetUserId: target.id,
            action,
            reason: reason?.trim() || null,
            metadata: {
                targetRole: target.role,
                targetStatus: this.getUserStatus(target),
            },
        });

        await this.userManagementAuditRepository.save(audit);
    }

    private getUserStatus(user: User): 'ACTIVE' | 'INACTIVE' | 'DELETED' {
        if (user.deletedAt) {
            return 'DELETED';
        }

        if (!user.isActive) {
            return 'INACTIVE';
        }

        return 'ACTIVE';
    }

    private matchesStatus(user: User, requestedStatus?: string): boolean {
        if (!requestedStatus || requestedStatus.trim().toLowerCase() === 'all') {
            return true;
        }

        return this.getUserStatus(user) === requestedStatus.trim().toUpperCase();
    }
}
