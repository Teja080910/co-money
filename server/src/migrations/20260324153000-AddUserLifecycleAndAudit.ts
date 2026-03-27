import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLifecycleAndAudit20260324153000 implements MigrationInterface {
    name = 'AddUserLifecycleAndAudit20260324153000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deactivatedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`
            CREATE TABLE "user_management_audits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "actorUserId" uuid NOT NULL,
                "targetUserId" uuid NOT NULL,
                "action" character varying(50) NOT NULL,
                "reason" character varying(255),
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_management_audits_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "user_management_audits" ADD CONSTRAINT "FK_user_management_audits_actor" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_management_audits" ADD CONSTRAINT "FK_user_management_audits_target" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_management_audits" DROP CONSTRAINT "FK_user_management_audits_target"`);
        await queryRunner.query(`ALTER TABLE "user_management_audits" DROP CONSTRAINT "FK_user_management_audits_actor"`);
        await queryRunner.query(`DROP TABLE "user_management_audits"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deactivatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
    }
}
