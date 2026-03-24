import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionClaims20260324120000 implements MigrationInterface {
    name = 'AddPromotionClaims20260324120000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "promotion_claims" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "promotionId" uuid NOT NULL,
                "customerId" uuid NOT NULL,
                "walletTransactionId" uuid NOT NULL,
                "claimedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_promotion_claims_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_promotion_claims_promotion_customer" UNIQUE ("promotionId", "customerId")
            )
        `);
        await queryRunner.query(`ALTER TABLE "promotion_claims" ADD CONSTRAINT "FK_promotion_claims_promotion" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promotion_claims" ADD CONSTRAINT "FK_promotion_claims_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promotion_claims" ADD CONSTRAINT "FK_promotion_claims_wallet_transaction" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promotion_claims" DROP CONSTRAINT "FK_promotion_claims_wallet_transaction"`);
        await queryRunner.query(`ALTER TABLE "promotion_claims" DROP CONSTRAINT "FK_promotion_claims_customer"`);
        await queryRunner.query(`ALTER TABLE "promotion_claims" DROP CONSTRAINT "FK_promotion_claims_promotion"`);
        await queryRunner.query(`DROP TABLE "promotion_claims"`);
    }
}
