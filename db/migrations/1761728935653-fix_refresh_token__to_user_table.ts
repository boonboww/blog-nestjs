import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRefreshToken_toUserTable1761728935653
  implements MigrationInterface
{
  name = 'FixRefreshToken_toUserTable1761728935653';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`refresh_token\` \`refresh_token\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`refresh_token\` \`refresh_token\` varchar(255) NOT NULL`,
    );
  }
}
