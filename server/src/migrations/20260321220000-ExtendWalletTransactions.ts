import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendWalletTransactions20260321220000 implements MigrationInterface {
    name = 'ExtendWalletTransactions20260321220000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."wallet_transactions_pointtype_enum" AS ENUM('STANDARD', 'BONUS')`);
        await queryRunner.query(`CREATE TYPE "public"."wallet_transactions_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "pointType" "public"."wallet_transactions_pointtype_enum" NOT NULL DEFAULT 'STANDARD'`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "status" "public"."wallet_transactions_status_enum" NOT NULL DEFAULT 'SUCCESS'`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "fromShopId" uuid`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "toShopId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_transactions_customer_created_at" ON "wallet_transactions" ("customerId", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_transactions_status_type" ON "wallet_transactions" ("status", "type")`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transactions_from_shop" FOREIGN KEY ("fromShopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transactions_to_shop" FOREIGN KEY ("toShopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_to_shop"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_from_shop"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_wallet_transactions_status_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_wallet_transactions_customer_created_at"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "toShopId"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "fromShopId"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "pointType"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transactions_pointtype_enum"`);
    }
}
