import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationTable1765957978754 implements MigrationInterface {
    name = 'AddNotificationTable1765957978754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "recipient_id" integer NOT NULL, "sender_id" integer NOT NULL, "type" character varying NOT NULL DEFAULT 'like', "post_id" integer NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_9830357f52360a126737d498e66" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_56023c91b76b36125acd4dcd9c5" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_3ee113bf568b5efdc29cd95a360" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_3ee113bf568b5efdc29cd95a360"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_56023c91b76b36125acd4dcd9c5"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_9830357f52360a126737d498e66"`);
        await queryRunner.query(`DROP TABLE "notification"`);
    }

}
