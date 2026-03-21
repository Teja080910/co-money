import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoles20260321182305 implements MigrationInterface {
    name = 'AddUserRoles20260321182305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('CUSTOMER', 'MERCHANT', 'REPRESENTATIVE', 'ADMIN')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'CUSTOMER'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
}
