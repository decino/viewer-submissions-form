import {Constant, Inject, OnInit, Service} from "@tsed/di";
import {PendingEntryConfirmationModel} from "../model/db/PendingEntryConfirmation.model";
import {BadRequest, NotFound} from "@tsed/exceptions";
import {SubmissionModel} from "../model/db/Submission.model";
import {EmailService} from "./EmailService";
import {DiscordBotDispatcherService} from "./DiscordBotDispatcherService";
import {SubmissionSocket} from "./socket/SubmissionSocket";
import GlobalEnv from "../model/constants/GlobalEnv";
import {SentMessageInfo} from "nodemailer/lib/smtp-transport";
import {SubmissionConfirmationRepo} from "../db/repo/SubmissionConfirmationRepo";
import {SubmissionRepo} from "../db/repo/SubmissionRepo";
import {UUID} from "crypto";

@Service()
export class SubmissionConfirmationService implements OnInit {

    @Inject()
    private emailService: EmailService;

    @Inject()
    private discordBotDispatcherService: DiscordBotDispatcherService;

    @Inject()
    private submissionSocket: SubmissionSocket;

    @Inject()
    private submissionConfirmationRepo: SubmissionConfirmationRepo;

    @Inject()
    private submissionRepo: SubmissionRepo;

    @Constant(GlobalEnv.BASE_URL)
    private readonly baseUrl: string;

    public async processConfirmation(confirmationUid: UUID): Promise<SubmissionModel> {
        const confirmation = await this.submissionConfirmationRepo.getConfirmation(confirmationUid);
        if (!confirmation) {
            throw new NotFound(`Unable to find submission with ID: ${confirmationUid}. It may have expired.`);
        }
        const updatedSubmission = await this.submissionRepo.validateSubmission(confirmation.submission);
        // ignore promise
        this.discordBotDispatcherService.sendPendingSubmission(updatedSubmission);
        return updatedSubmission;
    }

    public async verifySubmissions(ids: number[]): Promise<void> {
        const unverifiedSubmissions = await this.submissionRepo.getUnverifiedSubmissions(ids);
        if (!unverifiedSubmissions || unverifiedSubmissions.length === 0) {
            throw new BadRequest(`No submissions with ids ${ids.join(", ")} found that need verification`);
        }
        const verifiedEntries = await this.submissionRepo.verifySubmissions(unverifiedSubmissions);

        for (const entry of verifiedEntries) {
            this.submissionSocket.emitSubmission(entry);

            // ignore promise
            this.discordBotDispatcherService.sendNewSubmission(entry);
        }
    }


    public async generateConfirmationEntry(submissionId: number): Promise<PendingEntryConfirmationModel> {
        const savedEntry = await this.submissionConfirmationRepo.createConfirmation(submissionId);
        const entryWithSubmission = await this.submissionConfirmationRepo.getConfirmation(savedEntry.confirmationUid);
        if (!entryWithSubmission) {
            throw new Error("Unable to query Db");
        }
        await this.sendConfirmationEmail(entryWithSubmission);
        return savedEntry;
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
