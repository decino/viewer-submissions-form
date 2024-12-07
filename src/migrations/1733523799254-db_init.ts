import { MigrationInterface, QueryRunner } from "typeorm";

export class DbInit1733523799254 implements MigrationInterface {
    name = "DbInit1733523799254";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "session_model"
                                 (
                                     "expiredAt"   bigint                   NOT NULL,
                                     "id"          varchar(255) PRIMARY KEY NOT NULL,
                                     "json"        text                     NOT NULL,
                                     "destroyedAt" datetime
                                 )`);
        await queryRunner.query(`CREATE INDEX "IDX_7992668fc9dea8e1e06c9f16d6" ON "session_model" ("expiredAt") `);
        await queryRunner.query(`CREATE TABLE "express_rate_limit_store_model"
                                 (
                                     "key"       varchar PRIMARY KEY NOT NULL,
                                     "totalHits" integer             NOT NULL,
                                     "resetTime" datetime            NOT NULL
                                 )`);
        await queryRunner.query(`CREATE TABLE "user_model"
                                 (
                                     "id"        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                                     "password"  varchar  NOT NULL,
                                     "email"     varchar  NOT NULL
                                 )`);
        await queryRunner.query(`CREATE TABLE "submission_model"
                                 (
                                     "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"         datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"         datetime NOT NULL DEFAULT (datetime('now')),
                                     "wadName"           varchar  NOT NULL,
                                     "wadURL"            text,
                                     "wadLevel"          varchar  NOT NULL,
                                     "wadEngine"         integer  NOT NULL,
                                     "gzDoomActions"     text,
                                     "submitterName"     text,
                                     "submitterAuthor"   boolean  NOT NULL DEFAULT (0),
                                     "distributable"     boolean  NOT NULL DEFAULT (0),
                                     "info"              text,
                                     "submissionRoundId" integer  NOT NULL,
                                     "playOrder"         integer,
                                     "customWadFileName" text,
                                     "youtubeLink"       text,
                                     "submitterEmail"    varchar  NOT NULL,
                                     "submissionValid"   boolean  NOT NULL DEFAULT (0),
                                     "isChosen"          boolean  NOT NULL DEFAULT (0),
                                     "verified"          boolean  NOT NULL DEFAULT (0),
                                     "recordedFormat"    text     NOT NULL DEFAULT ('Practised')
                                 )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7" ON "submission_model" ("submissionRoundId", "submitterEmail") `);
        await queryRunner.query(`CREATE TABLE "submission_round_model"
                                 (
                                     "id"        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                                     "active"    boolean  NOT NULL,
                                     "name"      varchar  NOT NULL,
                                     "paused"    boolean  NOT NULL DEFAULT (0),
                                     "end_date"  datetime
                                 )`);
        await queryRunner.query(`CREATE TABLE "submission_status_model"
                                 (
                                     "id"             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"      datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"      datetime NOT NULL DEFAULT (datetime('now')),
                                     "status"         text     NOT NULL DEFAULT ('Queued'),
                                     "submissionId"   integer  NOT NULL,
                                     "additionalInfo" text,
                                     CONSTRAINT "UQ_1caa01538f4c39f83fdd06285fc" UNIQUE ("submissionId"),
                                     CONSTRAINT "REL_1caa01538f4c39f83fdd06285f" UNIQUE ("submissionId")
                                 )`);
        await queryRunner.query(`CREATE TABLE "pending_entry_confirmation_model"
                                 (
                                     "id"              integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"       datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"       datetime NOT NULL DEFAULT (datetime('now')),
                                     "confirmationUid" text     NOT NULL,
                                     "submissionId"    integer  NOT NULL,
                                     CONSTRAINT "REL_f07853b24f0f6b29b574270782" UNIQUE ("submissionId")
                                 )`);
        await queryRunner.query(`CREATE TABLE "settings_model"
                                 (
                                     "id"        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                                     "setting"   text     NOT NULL,
                                     "value"     varchar  NOT NULL,
                                     CONSTRAINT "UQ_a1a5b961c85dda3776c0856fdca" UNIQUE ("setting")
                                 )`);
        await queryRunner.query(`DROP INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7"`);
        await queryRunner.query(`CREATE TABLE "temporary_submission_model"
                                 (
                                     "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"         datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"         datetime NOT NULL DEFAULT (datetime('now')),
                                     "wadName"           varchar  NOT NULL,
                                     "wadURL"            text,
                                     "wadLevel"          varchar  NOT NULL,
                                     "wadEngine"         integer  NOT NULL,
                                     "gzDoomActions"     text,
                                     "submitterName"     text,
                                     "submitterAuthor"   boolean  NOT NULL DEFAULT (0),
                                     "distributable"     boolean  NOT NULL DEFAULT (0),
                                     "info"              text,
                                     "submissionRoundId" integer  NOT NULL,
                                     "playOrder"         integer,
                                     "customWadFileName" text,
                                     "youtubeLink"       text,
                                     "submitterEmail"    varchar  NOT NULL,
                                     "submissionValid"   boolean  NOT NULL DEFAULT (0),
                                     "isChosen"          boolean  NOT NULL DEFAULT (0),
                                     "verified"          boolean  NOT NULL DEFAULT (0),
                                     "recordedFormat"    text     NOT NULL DEFAULT ('Practised'),
                                     CONSTRAINT "FK_b326b4d8fcc9cb80b8f50849b23" FOREIGN KEY ("submissionRoundId") REFERENCES "submission_round_model" ("id") ON DELETE CASCADE ON UPDATE CASCADE
                                 )`);
        await queryRunner.query(`INSERT INTO "temporary_submission_model"("id", "createdAt", "updatedAt", "wadName", "wadURL", "wadLevel", "wadEngine", "gzDoomActions", "submitterName", "submitterAuthor", "distributable", "info", "submissionRoundId", "playOrder", "customWadFileName", "youtubeLink", "submitterEmail", "submissionValid", "isChosen", "verified", "recordedFormat")
                                 SELECT "id",
                                        "createdAt",
                                        "updatedAt",
                                        "wadName",
                                        "wadURL",
                                        "wadLevel",
                                        "wadEngine",
                                        "gzDoomActions",
                                        "submitterName",
                                        "submitterAuthor",
                                        "distributable",
                                        "info",
                                        "submissionRoundId",
                                        "playOrder",
                                        "customWadFileName",
                                        "youtubeLink",
                                        "submitterEmail",
                                        "submissionValid",
                                        "isChosen",
                                        "verified",
                                        "recordedFormat"
                                 FROM "submission_model"`);
        await queryRunner.query(`DROP TABLE "submission_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_submission_model"
            RENAME TO "submission_model"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7" ON "submission_model" ("submissionRoundId", "submitterEmail") `);
        await queryRunner.query(`CREATE TABLE "temporary_submission_status_model"
                                 (
                                     "id"             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"      datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"      datetime NOT NULL DEFAULT (datetime('now')),
                                     "status"         text     NOT NULL DEFAULT ('Queued'),
                                     "submissionId"   integer  NOT NULL,
                                     "additionalInfo" text,
                                     CONSTRAINT "UQ_1caa01538f4c39f83fdd06285fc" UNIQUE ("submissionId"),
                                     CONSTRAINT "REL_1caa01538f4c39f83fdd06285f" UNIQUE ("submissionId"),
                                     CONSTRAINT "FK_1caa01538f4c39f83fdd06285fc" FOREIGN KEY ("submissionId") REFERENCES "submission_model" ("id") ON DELETE CASCADE ON UPDATE CASCADE
                                 )`);
        await queryRunner.query(`INSERT INTO "temporary_submission_status_model"("id", "createdAt", "updatedAt", "status", "submissionId", "additionalInfo")
                                 SELECT "id", "createdAt", "updatedAt", "status", "submissionId", "additionalInfo"
                                 FROM "submission_status_model"`);
        await queryRunner.query(`DROP TABLE "submission_status_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_submission_status_model"
            RENAME TO "submission_status_model"`);
        await queryRunner.query(`CREATE TABLE "temporary_pending_entry_confirmation_model"
                                 (
                                     "id"              integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"       datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"       datetime NOT NULL DEFAULT (datetime('now')),
                                     "confirmationUid" text     NOT NULL,
                                     "submissionId"    integer  NOT NULL,
                                     CONSTRAINT "REL_f07853b24f0f6b29b574270782" UNIQUE ("submissionId"),
                                     CONSTRAINT "FK_f07853b24f0f6b29b5742707823" FOREIGN KEY ("submissionId") REFERENCES "submission_model" ("id") ON DELETE CASCADE ON UPDATE CASCADE
                                 )`);
        await queryRunner.query(`INSERT INTO "temporary_pending_entry_confirmation_model"("id", "createdAt", "updatedAt", "confirmationUid", "submissionId")
                                 SELECT "id", "createdAt", "updatedAt", "confirmationUid", "submissionId"
                                 FROM "pending_entry_confirmation_model"`);
        await queryRunner.query(`DROP TABLE "pending_entry_confirmation_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_pending_entry_confirmation_model"
            RENAME TO "pending_entry_confirmation_model"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_entry_confirmation_model"
            RENAME TO "temporary_pending_entry_confirmation_model"`);
        await queryRunner.query(`CREATE TABLE "pending_entry_confirmation_model"
                                 (
                                     "id"              integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"       datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"       datetime NOT NULL DEFAULT (datetime('now')),
                                     "confirmationUid" text     NOT NULL,
                                     "submissionId"    integer  NOT NULL,
                                     CONSTRAINT "REL_f07853b24f0f6b29b574270782" UNIQUE ("submissionId")
                                 )`);
        await queryRunner.query(`INSERT INTO "pending_entry_confirmation_model"("id", "createdAt", "updatedAt", "confirmationUid", "submissionId")
                                 SELECT "id", "createdAt", "updatedAt", "confirmationUid", "submissionId"
                                 FROM "temporary_pending_entry_confirmation_model"`);
        await queryRunner.query(`DROP TABLE "temporary_pending_entry_confirmation_model"`);
        await queryRunner.query(`ALTER TABLE "submission_status_model"
            RENAME TO "temporary_submission_status_model"`);
        await queryRunner.query(`CREATE TABLE "submission_status_model"
                                 (
                                     "id"             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"      datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"      datetime NOT NULL DEFAULT (datetime('now')),
                                     "status"         text     NOT NULL DEFAULT ('Queued'),
                                     "submissionId"   integer  NOT NULL,
                                     "additionalInfo" text,
                                     CONSTRAINT "UQ_1caa01538f4c39f83fdd06285fc" UNIQUE ("submissionId"),
                                     CONSTRAINT "REL_1caa01538f4c39f83fdd06285f" UNIQUE ("submissionId")
                                 )`);
        await queryRunner.query(`INSERT INTO "submission_status_model"("id", "createdAt", "updatedAt", "status", "submissionId", "additionalInfo")
                                 SELECT "id", "createdAt", "updatedAt", "status", "submissionId", "additionalInfo"
                                 FROM "temporary_submission_status_model"`);
        await queryRunner.query(`DROP TABLE "temporary_submission_status_model"`);
        await queryRunner.query(`DROP INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7"`);
        await queryRunner.query(`ALTER TABLE "submission_model"
            RENAME TO "temporary_submission_model"`);
        await queryRunner.query(`CREATE TABLE "submission_model"
                                 (
                                     "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdAt"         datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedAt"         datetime NOT NULL DEFAULT (datetime('now')),
                                     "wadName"           varchar  NOT NULL,
                                     "wadURL"            text,
                                     "wadLevel"          varchar  NOT NULL,
                                     "wadEngine"         integer  NOT NULL,
                                     "gzDoomActions"     text,
                                     "submitterName"     text,
                                     "submitterAuthor"   boolean  NOT NULL DEFAULT (0),
                                     "distributable"     boolean  NOT NULL DEFAULT (0),
                                     "info"              text,
                                     "submissionRoundId" integer  NOT NULL,
                                     "playOrder"         integer,
                                     "customWadFileName" text,
                                     "youtubeLink"       text,
                                     "submitterEmail"    varchar  NOT NULL,
                                     "submissionValid"   boolean  NOT NULL DEFAULT (0),
                                     "isChosen"          boolean  NOT NULL DEFAULT (0),
                                     "verified"          boolean  NOT NULL DEFAULT (0),
                                     "recordedFormat"    text     NOT NULL DEFAULT ('Practised')
                                 )`);
        await queryRunner.query(`INSERT INTO "submission_model"("id", "createdAt", "updatedAt", "wadName", "wadURL", "wadLevel", "wadEngine", "gzDoomActions", "submitterName", "submitterAuthor", "distributable", "info", "submissionRoundId", "playOrder", "customWadFileName", "youtubeLink", "submitterEmail", "submissionValid", "isChosen", "verified", "recordedFormat")
                                 SELECT "id",
                                        "createdAt",
                                        "updatedAt",
                                        "wadName",
                                        "wadURL",
                                        "wadLevel",
                                        "wadEngine",
                                        "gzDoomActions",
                                        "submitterName",
                                        "submitterAuthor",
                                        "distributable",
                                        "info",
                                        "submissionRoundId",
                                        "playOrder",
                                        "customWadFileName",
                                        "youtubeLink",
                                        "submitterEmail",
                                        "submissionValid",
                                        "isChosen",
                                        "verified",
                                        "recordedFormat"
                                 FROM "temporary_submission_model"`);
        await queryRunner.query(`DROP TABLE "temporary_submission_model"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7" ON "submission_model" ("submissionRoundId", "submitterEmail") `);
        await queryRunner.query(`DROP TABLE "settings_model"`);
        await queryRunner.query(`DROP TABLE "pending_entry_confirmation_model"`);
        await queryRunner.query(`DROP TABLE "submission_status_model"`);
        await queryRunner.query(`DROP TABLE "submission_round_model"`);
        await queryRunner.query(`DROP INDEX "IDX_e6fda8f8b236cecaf1ff5f73a7"`);
        await queryRunner.query(`DROP TABLE "submission_model"`);
        await queryRunner.query(`DROP TABLE "user_model"`);
        await queryRunner.query(`DROP TABLE "express_rate_limit_store_model"`);
        await queryRunner.query(`DROP INDEX "IDX_7992668fc9dea8e1e06c9f16d6"`);
        await queryRunner.query(`DROP TABLE "session_model"`);
    }

}
