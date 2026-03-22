import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionsEventsAndTransactionSettlementFields20260322110000 implements MigrationInterface {
    name = 'AddPromotionsEventsAndTransactionSettlementFields20260322110000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "promotions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" character varying(500),
                "shopId" uuid NOT NULL,
                "merchantId" uuid NOT NULL,
                "bonusPoints" integer NOT NULL DEFAULT '0',
                "maxDiscountPercent" integer NOT NULL DEFAULT '30',
                "startsAt" TIMESTAMP NOT NULL,
                "endsAt" TIMESTAMP NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_promotions_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" character varying(500),
                "location" character varying(255) NOT NULL,
                "startsAt" TIMESTAMP NOT NULL,
                "endsAt" TIMESTAMP NOT NULL,
                "createdByUserId" uuid NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_events_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "purchaseAmount" integer`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "discountAmount" integer`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "payableAmount" integer`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "earnedPoints" integer`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "isFirstTransactionBonus" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "promotions" ADD CONSTRAINT "FK_promotions_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promotions" ADD CONSTRAINT "FK_promotions_merchant" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_events_creator" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_creator"`);
        await queryRunner.query(`ALTER TABLE "promotions" DROP CONSTRAINT "FK_promotions_merchant"`);
        await queryRunner.query(`ALTER TABLE "promotions" DROP CONSTRAINT "FK_promotions_shop"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "isFirstTransactionBonus"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "earnedPoints"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "payableAmount"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "discountAmount"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "purchaseAmount"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "promotions"`);
    }
}
