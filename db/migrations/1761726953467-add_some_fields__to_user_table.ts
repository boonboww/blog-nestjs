import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSomeFields_toUserTable1761726953467
  implements MigrationInterface
{
  name = 'AddSomeFields_toUserTable1761726953467';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`isActive\``);
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`refresh_token\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`status\` int NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`created_at\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`status\``);
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`refresh_token\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`isActive\` int NOT NULL DEFAULT '1'`,
    );
  }
}
