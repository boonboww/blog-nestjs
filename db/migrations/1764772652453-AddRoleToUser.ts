import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUser1764772652453 implements MigrationInterface {
    name = 'AddRoleToUser1764772652453'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`role\` \`role\` varchar(255) NOT NULL DEFAULT 'user'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`role\` \`role\` varchar(255) NOT NULL`);
    }

}
