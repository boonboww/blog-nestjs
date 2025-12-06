import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCategory1765036756027 implements MigrationInterface {
  name = 'RemoveCategory1765036756027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`post\` DROP FOREIGN KEY \`FK_1077d47e0112cad3c16bbcea6cd\``,
    );
    await queryRunner.query(`ALTER TABLE \`post\` DROP COLUMN \`categoryId\``);
    await queryRunner.query(`DROP TABLE \`category\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`post\` ADD \`categoryId\` int NULL`);
    await queryRunner.query(
      `ALTER TABLE \`post\` ADD CONSTRAINT \`FK_1077d47e0112cad3c16bbcea6cd\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
