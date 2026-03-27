import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesAndSystemConfig20260324170000 implements MigrationInterface {
    name = 'AddCategoriesAndSystemConfig20260324170000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "shop_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "shopId" uuid NOT NULL,
                "name" character varying(120) NOT NULL,
                "formattedName" character varying(140) NOT NULL,
                "discountPercent" integer NOT NULL DEFAULT '30',
                "isDefault" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdByUserId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_shop_categories_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "system_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "version" integer NOT NULL,
                "welcomeBonusPoints" integer NOT NULL DEFAULT '10',
                "pointExpirationDays" integer NOT NULL DEFAULT '365',
                "maxPointsPerTransaction" integer NOT NULL DEFAULT '1000',
                "defaultMaxDiscountPercent" integer NOT NULL DEFAULT '30',
                "updatedByUserId" uuid NOT NULL,
                "changeReason" character varying(255),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_system_configs_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "shop_categories" ADD CONSTRAINT "FK_shop_categories_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shop_categories" ADD CONSTRAINT "FK_shop_categories_creator" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD CONSTRAINT "FK_system_configs_updater" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_shop_categories_default_shop" ON "shop_categories" ("shopId") WHERE "isDefault" = true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_shop_categories_default_shop"`);
        await queryRunner.query(`ALTER TABLE "system_configs" DROP CONSTRAINT "FK_system_configs_updater"`);
        await queryRunner.query(`ALTER TABLE "shop_categories" DROP CONSTRAINT "FK_shop_categories_creator"`);
        await queryRunner.query(`ALTER TABLE "shop_categories" DROP CONSTRAINT "FK_shop_categories_shop"`);
        await queryRunner.query(`DROP TABLE "system_configs"`);
        await queryRunner.query(`DROP TABLE "shop_categories"`);
    }
}
