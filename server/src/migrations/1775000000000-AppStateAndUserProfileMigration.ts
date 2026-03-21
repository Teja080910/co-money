import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppStateAndUserProfileMigration1775000000000 implements MigrationInterface {
  name = 'AppStateAndUserProfileMigration1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fullName" character varying(255) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" character varying(32) NOT NULL DEFAULT 'customer'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "managedShopIds" text array NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "managedMerchantIds" text array NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_state" (
        "id" character varying(64) NOT NULL,
        "shops" jsonb NOT NULL DEFAULT '[]',
        "wallets" jsonb NOT NULL DEFAULT '[]',
        "promotions" jsonb NOT NULL DEFAULT '[]',
        "events" jsonb NOT NULL DEFAULT '[]',
        "transactions" jsonb NOT NULL DEFAULT '[]',
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_state_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "app_state"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "managedMerchantIds"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "managedShopIds"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "fullName"`);
  }
}
