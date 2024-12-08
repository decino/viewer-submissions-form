import { UUID } from "crypto";
import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { AbstractDao } from "./AbstractDao.js";
import { PendingEntryConfirmationModel } from "../../model/db/PendingEntryConfirmation.model.js";
import { Logger } from "@tsed/logger";
import { SQLITE_DATA_SOURCE } from "../../model/di/tokens.js";
import { DataSource, EntityManager } from "typeorm";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class SubmissionConfirmationDao extends AbstractDao<PendingEntryConfirmationModel> {
    @Inject()
    private logger: Logger;

    public constructor(@Inject(SQLITE_DATA_SOURCE) ds: DataSource) {
        super(ds, PendingEntryConfirmationModel);
    }

    public createConfirmation(
        pendingEntryConfirmationModel: PendingEntryConfirmationModel,
        transaction?: EntityManager,
    ): Promise<PendingEntryConfirmationModel> {
        return this.getEntityManager(transaction).save(pendingEntryConfirmationModel);
    }

    public getConfirmation(
        confirmationUid: UUID,
        transaction?: EntityManager,
    ): Promise<PendingEntryConfirmationModel | null> {
        return this.getEntityManager(transaction).findOne({
            where: {
                confirmationUid,
            },
            relations: ["submission", "submission.submissionRound"],
        });
    }

    public async deleteConfirmation(
        confirmation: PendingEntryConfirmationModel,
        transaction?: EntityManager,
    ): Promise<boolean> {
        try {
            await this.getEntityManager(transaction).remove(confirmation);
        } catch (e) {
            this.logger.error(e);
            return false;
        }
        return true;
    }
}
