import {PendingEntryConfirmationModel} from "../../model/db/PendingEntryConfirmation.model";
import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {SubmissionConfirmationDao} from "../dao/SubmissionConfirmationDao";
import {Builder} from "builder-pattern";
import {UUID} from "crypto";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class SubmissionConfirmationRepo {

    @Inject()
    private submissionConfirmationDao: SubmissionConfirmationDao;

    public createConfirmation(submissionId: number): Promise<PendingEntryConfirmationModel> {
        const entry = Builder(PendingEntryConfirmationModel)
            .submissionId(submissionId)
            .build();
        return this.submissionConfirmationDao.createConfirmation(entry);
    }

    public getConfirmation(confirmationUid: UUID): Promise<PendingEntryConfirmationModel | null> {
        return this.submissionConfirmationDao.getConfirmation(confirmationUid);
    }

    public deleteConfirmation(confirmation: PendingEntryConfirmationModel): Promise<boolean> {
        return this.submissionConfirmationDao.deleteConfirmation(confirmation);
    }

}
