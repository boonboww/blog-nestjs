import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailColumnToUserTable1761722629009
  implements MigrationInterface
{
  name = 'AddEmailColumnToUserTable1761722629009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`first_name\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`last_name\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`status\``);
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`first_Name\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`last_Name\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`email\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`isActive\` int NOT NULL DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`isActive\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`email\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`last_Name\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`first_Name\``);
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`status\` int NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`last_name\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`first_name\` varchar(255) NOT NULL`,
    );
  }
}
