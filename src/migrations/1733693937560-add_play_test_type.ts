import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlayTestType1733693937560 implements MigrationInterface {
    name = 'AddPlayTestType1733693937560'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7"`);
        await queryRunner.query(`CREATE TABLE "temporary_submission_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "wadName" varchar NOT NULL, "wadURL" text, "wadLevel" varchar NOT NULL, "wadEngine" integer NOT NULL, "gzDoomActions" text, "submitterName" text, "submitterAuthor" boolean NOT NULL DEFAULT (0), "distributable" boolean NOT NULL DEFAULT (0), "info" text, "submissionRoundId" integer NOT NULL, "playOrder" integer, "customWadFileName" text, "youtubeLink" text, "submitterEmail" varchar NOT NULL, "submissionValid" boolean NOT NULL DEFAULT (0), "isChosen" boolean NOT NULL DEFAULT (0), "verified" boolean NOT NULL DEFAULT (0), "recordedFormat" text NOT NULL DEFAULT ('Practised'), "playTestEngine" varchar, CONSTRAINT "FK_b326b4d8fcc9cb80b8f50849b23" FOREIGN KEY ("submissionRoundId") REFERENCES "submission_round_model" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_submission_model"("id", "createdAt", "updatedAt", "wadName", "wadURL", "wadLevel", "wadEngine", "gzDoomActions", "submitterName", "submitterAuthor", "distributable", "info", "submissionRoundId", "playOrder", "customWadFileName", "youtubeLink", "submitterEmail", "submissionValid", "isChosen", "verified", "recordedFormat") SELECT "id", "createdAt", "updatedAt", "wadName", "wadURL", "wadLevel", "wadEngine", "gzDoomActions", "submitterName", "submitterAuthor", "distributable", "info", "submissionRoundId", "playOrder", "customWadFileName", "youtubeLink", "submitterEmail", "submissionValid", "isChosen", "verified", "recordedFormat" FROM "submission_model"`);
        await queryRunner.query(`DROP TABLE "submission_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_submission_model" RENAME TO "submission_model"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7" ON "submission_model" ("submissionRoundId", "submitterEmail") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7"`);
        await queryRunner.query(`ALTER TABLE "submission_model" RENAME TO "temporary_submission_model"`);
        await queryRunner.query(`CREATE TABLE "submission_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "wadName" varchar NOT NULL, "wadURL" text, "wadLevel" varchar NOT NULL, "wadEngine" integer NOT NULL, "gzDoomActions" text, "submitterName" text, "submitterAuthor" boolean NOT NULL DEFAULT (0), "distributable" boolean NOT NULL DEFAULT (0), "info" text, "submissionRoundId" integer NOT NULL, "playOrder" integer, "customWadFileName" text, "youtubeLink" text, "submitterEmail" varchar NOT NULL, "submissionValid" boolean NOT NULL DEFAULT (0), "isChosen" boolean NOT NULL DEFAULT (0), "verified" boolean NOT NULL DEFAULT (0), "recordedFormat" text NOT NULL DEFAULT ('Practised'), CONSTRAINT "FK_b326b4d8fcc9cb80b8f50849b23" FOREIGN KEY ("submissionRoundId") REFERENCES "submission_round_model" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "submission_model"("id", "createdAt", "updatedAt", "wadName", "wadURL", "wadLevel", "wadEngine", "gzDoomActions", "submitterName", "submitterAuthor", "distributable", "info", "submissionRoundId", "playOrder", "customWadFileName", "youtubeLink", "submitterEmail", "submissionValid", "isChosen", "verified", "recordedFormat") SELECT "id", "createdAt", "updatedAt", "wadName", "wadURL", "wadLevel", "wadEngine", "gzDoomActions", "submitterName", "submitterAuthor", "distributable", "info", "submissionRoundId", "playOrder", "customWadFileName", "youtubeLink", "submitterEmail", "submissionValid", "isChosen", "verified", "recordedFormat" FROM "temporary_submission_model"`);
        await queryRunner.query(`DROP TABLE "temporary_submission_model"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7" ON "submission_model" ("submissionRoundId", "submitterEmail") `);
    }

}
