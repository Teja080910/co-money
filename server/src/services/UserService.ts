import { AppDataSource } from '../config/db';
import { UserRole } from '../constants/userRoles';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { AuthenticatedUser } from '../middleware/requireRole';

const MANAGEABLE_ROLES_BY_ACTOR: Record<UserRole, UserRole[]> = {
    [UserRole.ADMIN]: [UserRole.REPRESENTATIVE, UserRole.MERCHANT, UserRole.CUSTOMER],
    [UserRole.REPRESENTATIVE]: [UserRole.MERCHANT, UserRole.CUSTOMER],
    [UserRole.MERCHANT]: [UserRole.CUSTOMER],
    [UserRole.CUSTOMER]: [],
};

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    public async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find();
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    public sanitizeUsers(users: User[]) {
        return users.map(user => this.sanitizeUser(user));
    }
}
