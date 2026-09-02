import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConfirmedAt1788381029046 implements MigrationInterface {
    name = "AddConfirmedAt1788381029046";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_entry_confirmation_model" ADD COLUMN "confirmedAt" datetime`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_entry_confirmation_model" DROP COLUMN "confirmedAt"`);
    }
}
