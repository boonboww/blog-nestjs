import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFielsRoleToUserTable1764771342939 implements MigrationInterface {
    name = 'AddFielsRoleToUserTable1764771342939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`role\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`role\``);
    }

}
