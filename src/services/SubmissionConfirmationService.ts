import {Inject, OnInit, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {PendingEntryConfirmationModel} from "../model/db/PendingEntryConfirmation.model";
import {NotFound} from "@tsed/exceptions";
import {SubmissionModel} from "../model/db/Submission.model";
import {Logger} from "@tsed/common";
import {EmailService} from "./EmailService";
import process from "process";
import {DiscordBotDispatcherService} from "./DiscordBotDispatcherService";

@Service()
export class SubmissionConfirmationService implements OnInit {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private logger: Logger;

    @Inject()
    private emailService: EmailService;

    @Inject()
    private discordBotDispatcherService: DiscordBotDispatcherService;

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
                throw new NotFound(`Unable to find submission with ID: ${confirmationUid}. It may have expired.`);
            }
            const submission = confirmationEntry.submission;
            submission.submissionValid = true;
            await submissionModelRepository.save(submission);
            await confirmationModelRepository.remove(confirmationEntry);
            return submission;
        }).then(submission => {
            this.discordBotDispatcherService.dispatch(submission);
        });
    }


    public async generateConfirmationEntry(email: string, round: number): Promise<PendingEntryConfirmationModel> {
        const confirmationModelRepository = this.ds.getRepository(PendingEntryConfirmationModel);
        const newEntry = this.ds.manager.create(PendingEntryConfirmationModel, {
            submitterEmail: email,
            submissionRoundId: round
        });
        const saveEntry = await confirmationModelRepository.save(newEntry);
        await this.sendConfirmationEmail(saveEntry);
        return saveEntry;
    }

    public $onInit(): Promise<any> | void {
        if (!process.env.BASE_URL) {
            throw new Error("Base URL has not been set.");
        }
    }

    private sendConfirmationEmail(pendingEntry: PendingEntryConfirmationModel): Promise<string> {
        const baseUrl = process.env.BASE_URL;
        const confirmationUrl = `${baseUrl}/processSubmission?uid=${pendingEntry.confirmationUid}`;
        const body = `Please click the link below to confirm your submission. This link will expire in 20 minutes.\n${confirmationUrl}`;
        return this.emailService.sendMail(body, pendingEntry.submitterEmail);
    }

}
