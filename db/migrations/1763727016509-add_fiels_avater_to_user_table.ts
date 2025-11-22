import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFielsAvaterToUserTable1763727016509 implements MigrationInterface {
    name = 'AddFielsAvaterToUserTable1763727016509'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`avatar\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`avatar\``);
    }

}
