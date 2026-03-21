import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/db';
import { UserRole } from '../constants/userRoles';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';

dotenv.config();

type SeedUserDefinition = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
};

function getRequiredSeedPassword(envKey: string, fallback: string): string {
    const configuredPassword = process.env[envKey]?.trim();

    if (configuredPassword) {
        return configuredPassword;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error(`${envKey} is required in production.`);
    }

    return fallback;
}

function getSeedUsers(): SeedUserDefinition[] {
    return [
        {
            firstName: 'System',
            lastName: 'Admin',
            username: 'admin',
            email: process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@sottocasa.it',
            password: getRequiredSeedPassword('SEED_ADMIN_PASSWORD', 'Admin123!'),
            role: UserRole.ADMIN,
        },
        {
            firstName: 'Demo',
            lastName: 'Merchant',
            username: 'merchant',
            email: process.env.SEED_MERCHANT_EMAIL?.trim() || 'merchant@sottocasa.it',
            password: getRequiredSeedPassword('SEED_MERCHANT_PASSWORD', 'Merchant123!'),
            role: UserRole.MERCHANT,
        },
        {
            firstName: 'Demo',
            lastName: 'Representative',
            username: 'representative',
            email: process.env.SEED_REPRESENTATIVE_EMAIL?.trim() || 'representative@sottocasa.it',
            password: getRequiredSeedPassword('SEED_REPRESENTATIVE_PASSWORD', 'Representative123!'),
            role: UserRole.REPRESENTATIVE,
        },
    ];
}

async function seedRoleUsers(): Promise<void> {
    if (process.env.ALLOW_ROLE_USER_SEED !== 'true') {
        throw new Error('Set ALLOW_ROLE_USER_SEED=true to run this script.');
    }

    await AppDataSource.initialize();

    try {
        const userRepository = AppDataSource.getRepository(User);

        for (const seedUser of getSeedUsers()) {
            const existingUser = await userRepository.findOneBy({ email: seedUser.email.toLowerCase() });
            const password = hashPassword(seedUser.password);

            if (existingUser) {
                existingUser.firstName = seedUser.firstName;
                existingUser.lastName = seedUser.lastName;
                existingUser.username = seedUser.username;
                existingUser.password = password;
                existingUser.role = seedUser.role;
                existingUser.emailVerified = true;
                existingUser.verificationCode = null;
                existingUser.verificationCodeExpiresAt = null;
                await userRepository.save(existingUser);
                console.log(`Updated seeded user: ${seedUser.email}`);
                continue;
            }

            const newUser = userRepository.create({
                firstName: seedUser.firstName,
                lastName: seedUser.lastName,
                username: seedUser.username,
                email: seedUser.email.toLowerCase(),
                password,
                role: seedUser.role,
                emailVerified: true,
                verificationCode: null,
                verificationCodeExpiresAt: null,
            });

            await userRepository.save(newUser);
            console.log(`Created seeded user: ${seedUser.email}`);
        }
    } finally {
        await AppDataSource.destroy();
    }
}

seedRoleUsers()
    .then(() => {
        console.log('Role-based user seed completed successfully.');
    })
    .catch((error) => {
        console.error('Role-based user seed failed:', error);
        process.exitCode = 1;
    });
