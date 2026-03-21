import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWalletAndShops20260321185509 implements MigrationInterface {
    name = 'AddWalletAndShops20260321185509'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "shops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "merchantId" uuid NOT NULL, "representativeId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9a71e14f4e3c0ce70ff3b5d7139" UNIQUE ("name"), CONSTRAINT "PK_b1b6d488f742e4ace2256de7654" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" uuid NOT NULL, "balance" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_wallets_customerId" UNIQUE ("customerId"), CONSTRAINT "PK_wallets_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."wallet_transactions_type_enum" AS ENUM('EARN', 'SPEND', 'ADJUSTMENT')`);
        await queryRunner.query(`CREATE TABLE "wallet_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "walletId" uuid NOT NULL, "customerId" uuid NOT NULL, "merchantId" uuid NOT NULL, "performedByUserId" uuid NOT NULL, "shopId" uuid NOT NULL, "type" "public"."wallet_transactions_type_enum" NOT NULL, "points" integer NOT NULL, "balanceBefore" integer NOT NULL, "balanceAfter" integer NOT NULL, "description" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_63a6d8da93f7af2f1a3c2d49ab0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shops" ADD CONSTRAINT "FK_shops_merchant" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shops" ADD CONSTRAINT "FK_shops_representative" FOREIGN KEY ("representativeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_wallets_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`INSERT INTO "wallets" ("customerId", "balance") SELECT "id", 0 FROM "users" WHERE "role" = 'CUSTOMER'`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transactions_wallet" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transactions_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transactions_merchant" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transactions_performed_by" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transactions_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_shop"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_performed_by"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_merchant"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_customer"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_wallet"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_wallets_customer"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP CONSTRAINT "FK_shops_representative"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP CONSTRAINT "FK_shops_merchant"`);
        await queryRunner.query(`DROP TABLE "wallet_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TABLE "shops"`);
    }
}
