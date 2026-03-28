import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendShopsForRepresentativeManagement20260322091500 implements MigrationInterface {
    name = 'ExtendShopsForRepresentativeManagement20260322091500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" ADD "location" character varying(255) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "description" character varying(500)`);
        await queryRunner.query(`CREATE INDEX "IDX_shops_merchantId" ON "shops" ("merchantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_shops_representativeId" ON "shops" ("representativeId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_shops_representativeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_shops_merchantId"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "location"`);
    }
}
