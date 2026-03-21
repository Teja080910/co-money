import 'reflect-metadata';
import { AppDataSource } from '../config/db';
import { demoStore } from '../data/demoStore';
import { AppState } from '../models/AppState';
import { User } from '../models/User';

async function seed() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const appStateRepository = AppDataSource.getRepository(AppState);

  await userRepository.clear();
  await appStateRepository.clear();

  const users = demoStore.users.map(user =>
    userRepository.create({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      verified: user.verified,
      createdAt: new Date(user.createdAt),
      managedShopIds: user.managedShopIds,
      managedMerchantIds: user.managedMerchantIds,
    }),
  );

  await userRepository.save(users);

  await appStateRepository.save(
    appStateRepository.create({
      id: 'default',
      shops: demoStore.shops,
      wallets: demoStore.wallets,
      promotions: demoStore.promotions,
      events: demoStore.events,
      transactions: demoStore.transactions,
    }),
  );

  console.log('Database seeded successfully.');
  await AppDataSource.destroy();
}

seed().catch(async error => {
  console.error('Seeding failed:', error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
