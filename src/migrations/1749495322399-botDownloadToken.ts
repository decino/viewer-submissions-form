import { MigrationInterface, QueryRunner } from "typeorm";

export class BotDownloadToken1749495322399 implements MigrationInterface {
    name = 'BotDownloadToken1749495322399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bot_download_authentication_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "token" text NOT NULL, "submissionId" integer NOT NULL, CONSTRAINT "REL_080eea72e1172f5c49c8b52a0e" UNIQUE ("submissionId"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c402b53868b3589a9225f26715" ON "bot_download_authentication_model" ("token", "submissionId") `);
        await queryRunner.query(`DROP INDEX "IDX_c402b53868b3589a9225f26715"`);
        await queryRunner.query(`CREATE TABLE "temporary_bot_download_authentication_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "token" text NOT NULL, "submissionId" integer NOT NULL, CONSTRAINT "REL_080eea72e1172f5c49c8b52a0e" UNIQUE ("submissionId"), CONSTRAINT "FK_080eea72e1172f5c49c8b52a0ed" FOREIGN KEY ("submissionId") REFERENCES "submission_model" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_bot_download_authentication_model"("id", "createdAt", "updatedAt", "token", "submissionId") SELECT "id", "createdAt", "updatedAt", "token", "submissionId" FROM "bot_download_authentication_model"`);
        await queryRunner.query(`DROP TABLE "bot_download_authentication_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_bot_download_authentication_model" RENAME TO "bot_download_authentication_model"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c402b53868b3589a9225f26715" ON "bot_download_authentication_model" ("token", "submissionId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_c402b53868b3589a9225f26715"`);
        await queryRunner.query(`ALTER TABLE "bot_download_authentication_model" RENAME TO "temporary_bot_download_authentication_model"`);
        await queryRunner.query(`CREATE TABLE "bot_download_authentication_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "token" text NOT NULL, "submissionId" integer NOT NULL, CONSTRAINT "REL_080eea72e1172f5c49c8b52a0e" UNIQUE ("submissionId"))`);
        await queryRunner.query(`INSERT INTO "bot_download_authentication_model"("id", "createdAt", "updatedAt", "token", "submissionId") SELECT "id", "createdAt", "updatedAt", "token", "submissionId" FROM "temporary_bot_download_authentication_model"`);
        await queryRunner.query(`DROP TABLE "temporary_bot_download_authentication_model"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c402b53868b3589a9225f26715" ON "bot_download_authentication_model" ("token", "submissionId") `);
        await queryRunner.query(`DROP INDEX "IDX_c402b53868b3589a9225f26715"`);
        await queryRunner.query(`DROP TABLE "bot_download_authentication_model"`);
    }

}
