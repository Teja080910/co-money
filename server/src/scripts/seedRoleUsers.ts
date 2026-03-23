import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/db';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { getRoleSeedUsers } from '../seed/demoSeedData';

dotenv.config();

async function seedRoleUsers(): Promise<void> {
    if (process.env.ALLOW_ROLE_USER_SEED !== 'true') {
        throw new Error('Role user seed is disabled. Run it with ALLOW_ROLE_USER_SEED=true or use npm run seed:roles.');
    }

    await AppDataSource.initialize();

    try {
        const userRepository = AppDataSource.getRepository(User);

        for (const seedUser of getRoleSeedUsers()) {
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
