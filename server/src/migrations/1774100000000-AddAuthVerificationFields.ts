import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthVerificationFields1774100000000 implements MigrationInterface {
    name = 'AddAuthVerificationFields1774100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationCode" character varying(6)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationCodeExpiresAt" TIMESTAMP`);
        await queryRunner.query(`UPDATE "users" SET "firstName" = COALESCE("firstName", "username"), "lastName" = COALESCE("lastName", ''), "emailVerified" = true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationCode"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    }
}
