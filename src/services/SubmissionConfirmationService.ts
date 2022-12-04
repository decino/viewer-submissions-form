import {Inject, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {PendingEntryConfirmationModel} from "../model/db/PendingEntryConfirmation.model";
import {NotFound} from "@tsed/exceptions";
import {SubmissionModel} from "../model/db/Submission.model";
import {Logger} from "@tsed/common";

@Service()
export class SubmissionConfirmationService {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private logger: Logger;

    public processConfirmation(confirmationUid: string): Promise<void> {
        return this.ds.manager.transaction(async entityManager => {
            const confirmationModelRepository = entityManager.getRepository(PendingEntryConfirmationModel);
            const submissionModelRepository = entityManager.getRepository(SubmissionModel);
            const confirmationEntry = await confirmationModelRepository.findOne({
                where: {
                    confirmationUid
                },
                relations: ["submission"]
            });
            if (!confirmationEntry) {
                throw new NotFound(`Unable to find submission with id: ${confirmationUid}, maybe it has expired`);
            }
            const submission = confirmationEntry.submission;
            submission.submissionValid = true;
            await submissionModelRepository.save(submission);
            await confirmationModelRepository.remove(confirmationEntry);
        });
    }

    public generateConfirmationEntry(email: string, round: number): Promise<PendingEntryConfirmationModel> {
        const confirmationModelRepository = this.ds.getRepository(PendingEntryConfirmationModel);
        const newEntry = this.ds.manager.create(PendingEntryConfirmationModel, {
            submitterEmail: email,
            submissionRoundId: round
        });
        return confirmationModelRepository.save(newEntry);
    }
}
