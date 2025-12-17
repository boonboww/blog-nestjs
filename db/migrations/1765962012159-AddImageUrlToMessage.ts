import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToMessage1765962012159 implements MigrationInterface {
    name = 'AddImageUrlToMessage1765962012159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" ADD "image_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "image_url"`);
    }

}
