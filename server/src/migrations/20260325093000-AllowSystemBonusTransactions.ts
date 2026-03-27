import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowSystemBonusTransactions20260325093000 implements MigrationInterface {
    name = 'AllowSystemBonusTransactions20260325093000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ALTER COLUMN "merchantId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ALTER COLUMN "shopId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "wallet_transactions" WHERE "merchantId" IS NULL OR "shopId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ALTER COLUMN "shopId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ALTER COLUMN "merchantId" SET NOT NULL`);
    }
}
