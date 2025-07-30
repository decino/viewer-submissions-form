import { Constant, Inject, OnInit, Service } from "@tsed/di";
import { PendingEntryConfirmationModel } from "../model/db/PendingEntryConfirmation.model.js";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { SubmissionModel } from "../model/db/Submission.model.js";
import { EmailService } from "./EmailService.js";
import { DiscordBotDispatcherService } from "./DiscordBotDispatcherService.js";
import { SubmissionSocket } from "./socket/SubmissionSocket.js";
import GlobalEnv from "../model/constants/GlobalEnv.js";
import { SentMessageInfo } from "nodemailer/lib/smtp-transport";
import { SubmissionConfirmationRepo } from "../db/repo/SubmissionConfirmationRepo.js";
import { SubmissionRepo } from "../db/repo/SubmissionRepo.js";
import { Logger } from "@tsed/common";
import EMAIL_TEMPLATE from "../model/constants/EmailTemplate.js";
import type { UUID } from "crypto";
import { SubmissionRoundRepo } from "../db/repo/SubmissionRoundRepo.js";

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

    @Inject()
    private submissionRoundRepo: SubmissionRoundRepo;

    @Inject()
    private logger: Logger;

    @Constant(GlobalEnv.BASE_URL)
    private readonly baseUrl: string;

    private sentCongrats = false;

    private currentRoundId: number | null = null;

    public async $onInit(): Promise<void> {
        const activeRound = await this.submissionRoundRepo.retrieveActiveRound();
        if (activeRound) {
            this.currentRoundId = activeRound.id;
            const numberOfEntriesInCurrentRound = await this.submissionRepo.getNumberOfSubmissions();
            const numberOfEntriesFromPreviousRound = await this.submissionRepo.getNumberOfSubmissionsForPreviousRound();

            this.sentCongrats = numberOfEntriesInCurrentRound > numberOfEntriesFromPreviousRound;
        }
    }

    public async processConfirmation(confirmationUid: UUID): Promise<SubmissionModel> {
        const confirmation = await this.submissionConfirmationRepo.getConfirmation(confirmationUid);
        if (!confirmation) {
            throw new NotFound(`Unable to find submission with ID: ${confirmationUid}. It may have expired.`);
        }
        const updatedSubmission = await this.submissionRepo.validateSubmission(confirmation);
        this.logger.info(`submission with uid ${confirmationUid} has been validated`);
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

        if (verifiedEntries.length === 0) {
            return;
        }

        const roundId = verifiedEntries[0].submissionRoundId;
        if (this.currentRoundId !== roundId) {
            this.currentRoundId = roundId;
            this.sentCongrats = false;
        }

        let numberOfEntriesInCurrentRound = await this.submissionRepo.getNumberOfSubmissions();
        const numberOfEntriesFromPreviousRound = await this.submissionRepo.getNumberOfSubmissionsForPreviousRound();

        for (const entry of verifiedEntries) {
            this.submissionSocket.emitSubmission(entry);
            this.discordBotDispatcherService.sendNewSubmission(entry);

            if (!this.sentCongrats && ++numberOfEntriesInCurrentRound > numberOfEntriesFromPreviousRound) {
                this.sentCongrats = true;
                this.discordBotDispatcherService.sendCongratulations();
            }
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

    private async sendConfirmationEmail(pendingEntry: PendingEntryConfirmationModel): Promise<SentMessageInfo> {
        const baseUrl = this.baseUrl;
        const guid = pendingEntry.confirmationUid;
        const confirmationUrl = `${baseUrl}/processSubmission?uid=${guid}`;
        const body = `Please click the link below to confirm your submission. This link will expire in 20 minutes.\n${confirmationUrl}`;
        const to = pendingEntry.submission.submitterEmail;
        const messageInfo = await this.emailService.sendMail(to, EMAIL_TEMPLATE.NEW_SUBMISSION, body);
        this.logger.info(`${to} email sent with guild ${guid}`);
        return messageInfo;
    }
}
