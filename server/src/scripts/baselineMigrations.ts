import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/db';

dotenv.config();

type BaselineMigration = {
    timestamp: number;
    name: string;
    isApplied: () => Promise<boolean>;
};

async function tableExists(tableName: string): Promise<boolean> {
    const result = await AppDataSource.query(
        `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = $1
            ) AS "exists"
        `,
        [tableName],
    );

    return Boolean(result?.[0]?.exists);
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
    const result = await AppDataSource.query(
        `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = $1
                  AND column_name = $2
            ) AS "exists"
        `,
        [tableName, columnName],
    );

    return Boolean(result?.[0]?.exists);
}

async function columnsExist(tableName: string, columnNames: string[]): Promise<boolean> {
    for (const columnName of columnNames) {
        if (!(await columnExists(tableName, columnName))) {
            return false;
        }
    }

    return true;
}

async function columnIsNullable(tableName: string, columnName: string): Promise<boolean> {
    const result = await AppDataSource.query(
        `
            SELECT is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = $1
              AND column_name = $2
        `,
        [tableName, columnName],
    );

    return result?.[0]?.is_nullable === 'YES';
}

async function ensureMigrationsTable(): Promise<void> {
    await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "migrations" (
            "id" SERIAL NOT NULL,
            "timestamp" bigint NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_migrations_id" PRIMARY KEY ("id")
        )
    `);
}

const baselineMigrations: BaselineMigration[] = [
    {
        timestamp: 20260321170000,
        name: 'InitialMigration20260321170000',
        isApplied: async () => tableExists('users'),
    },
    {
        timestamp: 20260321180000,
        name: 'AddAuthVerificationFields20260321180000',
        isApplied: async () => columnsExist('users', [
            'firstName',
            'lastName',
            'emailVerified',
            'verificationCode',
            'verificationCodeExpiresAt',
        ]),
    },
    {
        timestamp: 20260321182305,
        name: 'AddUserRoles20260321182305',
        isApplied: async () => columnExists('users', 'role'),
    },
    {
        timestamp: 20260321185509,
        name: 'AddWalletAndShops20260321185509',
        isApplied: async () =>
            await tableExists('shops')
            && await tableExists('wallets')
            && await tableExists('wallet_transactions'),
    },
    {
        timestamp: 20260321220000,
        name: 'ExtendWalletTransactions20260321220000',
        isApplied: async () => columnsExist('wallet_transactions', [
            'pointType',
            'status',
            'fromShopId',
            'toShopId',
        ]),
    },
    {
        timestamp: 20260322091500,
        name: 'ExtendShopsForRepresentativeManagement20260322091500',
        isApplied: async () => columnsExist('shops', ['location', 'description']),
    },
    {
        timestamp: 20260322110000,
        name: 'AddPromotionsEventsAndTransactionSettlementFields20260322110000',
        isApplied: async () =>
            await tableExists('promotions')
            && await tableExists('events')
            && await columnsExist('wallet_transactions', [
                'purchaseAmount',
                'discountAmount',
                'payableAmount',
                'earnedPoints',
                'isFirstTransactionBonus',
            ]),
    },
    {
        timestamp: 20260324120000,
        name: 'AddPromotionClaims20260324120000',
        isApplied: async () => tableExists('promotion_claims'),
    },
    {
        timestamp: 20260324153000,
        name: 'AddUserLifecycleAndAudit20260324153000',
        isApplied: async () =>
            await columnsExist('users', ['isActive', 'deactivatedAt', 'deletedAt'])
            && await tableExists('user_management_audits'),
    },
    {
        timestamp: 20260324170000,
        name: 'AddCategoriesAndSystemConfig20260324170000',
        isApplied: async () =>
            await tableExists('shop_categories')
            && await tableExists('system_configs'),
    },
    {
        timestamp: 20260325093000,
        name: 'AllowSystemBonusTransactions20260325093000',
        isApplied: async () =>
            await columnIsNullable('wallet_transactions', 'merchantId')
            && await columnIsNullable('wallet_transactions', 'shopId'),
    },
];

async function baselineMigrationsHistory(): Promise<void> {
    await AppDataSource.initialize();

    try {
        await ensureMigrationsTable();

        const existingRows = await AppDataSource.query(`SELECT "timestamp", "name" FROM "migrations"`);
        const existingNames = new Set<string>(existingRows.map((row: { name: string }) => row.name));

        let insertedCount = 0;

        for (const migration of baselineMigrations) {
            const applied = await migration.isApplied();

            if (!applied) {
                console.log(`Stopped baselining at ${migration.name} because its schema changes are not present yet.`);
                break;
            }

            if (existingNames.has(migration.name)) {
                console.log(`Already recorded: ${migration.name}`);
                continue;
            }

            await AppDataSource.query(
                `INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`,
                [migration.timestamp, migration.name],
            );
            insertedCount += 1;
            console.log(`Recorded baseline migration: ${migration.name}`);
        }

        console.log(`Migration baseline complete. Inserted ${insertedCount} record(s).`);
    } finally {
        await AppDataSource.destroy();
    }
}

baselineMigrationsHistory().catch((error) => {
    console.error('Migration baseline failed:', error);
    process.exitCode = 1;
});
