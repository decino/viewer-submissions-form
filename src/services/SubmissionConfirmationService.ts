import {Constant, Inject, OnInit, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource, In} from "typeorm";
import {PendingEntryConfirmationModel} from "../model/db/PendingEntryConfirmation.model";
import {BadRequest, NotFound} from "@tsed/exceptions";
import {SubmissionModel} from "../model/db/Submission.model";
import {EmailService} from "./EmailService";
import {DiscordBotDispatcherService} from "./DiscordBotDispatcherService";
import {SubmissionSocket} from "./socket/SubmissionSocket";
import GlobalEnv from "../model/constants/GlobalEnv";
import {SentMessageInfo} from "nodemailer/lib/smtp-transport";

@Service()
export class SubmissionConfirmationService implements OnInit {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private emailService: EmailService;

    @Inject()
    private discordBotDispatcherService: DiscordBotDispatcherService;

    @Inject()
    private submissionSocket: SubmissionSocket;

    @Constant(GlobalEnv.BASE_URL)
    private readonly baseUrl: string;

    public processConfirmation(confirmationUid: string): Promise<SubmissionModel> {
        return this.ds.manager.transaction(async entityManager => {
            const confirmationModelRepository = entityManager.getRepository(PendingEntryConfirmationModel);
            const submissionModelRepository = entityManager.getRepository(SubmissionModel);
            const confirmationEntry = await confirmationModelRepository.findOne({
                where: {
                    confirmationUid
                },
                relations: ["submission", "submission.submissionRound"]
            });
            if (!confirmationEntry) {
                throw new NotFound(`Unable to find submission with ID: ${confirmationUid}. It may have expired.`);
            }
            const submission = confirmationEntry.submission;
            submission.submissionValid = true;
            await submissionModelRepository.save(submission);
            await confirmationModelRepository.remove(confirmationEntry);
            return submission;
        });
    }

    public async verifySubmissions(ids: number[]): Promise<void> {
        const submissionModelRepository = this.ds.getRepository(SubmissionModel);
        const entries = await submissionModelRepository.find({
            where: {
                id: In(ids),
                submissionValid: true,
                verified: false
            },
            relations: ["submissionRound"]
        });
        if (!entries || entries.length === 0) {
            throw new BadRequest(`No submissions with ids ${ids.join(", ")} found that need verification`);
        }
        for (const entry of entries) {
            entry.verified = true;
        }
        await submissionModelRepository.save(entries);
        for (const entry of entries) {
            this.submissionSocket.emitSubmission(entry);

            // ignore promise
            this.discordBotDispatcherService.dispatch(entry);
        }
    }


    public async generateConfirmationEntry(round: number): Promise<PendingEntryConfirmationModel> {
        const confirmationModelRepository = this.ds.getRepository(PendingEntryConfirmationModel);
        const newEntry = this.ds.manager.create(PendingEntryConfirmationModel, {
            submissionId: round
        });
        const saveEntry = await confirmationModelRepository.save(newEntry);
        const entry = await confirmationModelRepository.findOne({
            relations: ["submission"],
            where: {
                id: saveEntry.id
            }
        });
        if (!entry) {
            throw Error("Unable to query DB.");
        }
        await this.sendConfirmationEmail(entry);
        return saveEntry;
    }

    public $onInit(): Promise<any> | void {
        if (!this.baseUrl) {
            throw new Error("Base URL has not been set.");
        }
    }

    private sendConfirmationEmail(pendingEntry: PendingEntryConfirmationModel): Promise<SentMessageInfo> {
        const baseUrl = this.baseUrl;
        const confirmationUrl = `${baseUrl}/processSubmission?uid=${pendingEntry.confirmationUid}`;
        const body = `Please click the link below to confirm your submission. This link will expire in 20 minutes.\n${confirmationUrl}`;
        return this.emailService.sendMail(body, pendingEntry.submission.submitterEmail);
    }

}
