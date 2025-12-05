import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFriendshipTable1764913746917 implements MigrationInterface {
    name = 'CreateFriendshipTable1764913746917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`friendship\` (\`id\` int NOT NULL AUTO_INCREMENT, \`requester_id\` int NOT NULL, \`addressee_id\` int NOT NULL, \`status\` enum ('pending', 'accepted', 'rejected', 'blocked') NOT NULL DEFAULT 'pending', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_dbc5539de9195a9bed909357ffb\` FOREIGN KEY (\`requester_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_6964fb6d7c2d7fae5b79c7e0ed0\` FOREIGN KEY (\`addressee_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_6964fb6d7c2d7fae5b79c7e0ed0\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_dbc5539de9195a9bed909357ffb\``);
        await queryRunner.query(`DROP TABLE \`friendship\``);
    }

}
