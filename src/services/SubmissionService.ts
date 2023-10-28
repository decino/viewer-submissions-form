import {Constant, Inject, OnInit, Service} from "@tsed/di";
import {SubmissionModel} from "../model/db/Submission.model";
import {SubmissionRoundService} from "./SubmissionRoundService";
import {BadRequest, NotFound} from "@tsed/exceptions";
import {Logger, PlatformMulterFile} from "@tsed/common";
import {CustomWadEngine} from "../engine/CustomWadEngine";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {SubmissionConfirmationService} from "./SubmissionConfirmationService";
import {AsyncTask, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import DOOM_ENGINE from "../model/constants/DoomEngine";
import {SubmissionSocket} from "./socket/SubmissionSocket";
import {SubmissionStatusModel} from "../model/db/SubmissionStatus.model";
import GlobalEnv from "../model/constants/GlobalEnv";
import {WadValidationService} from "./WadValidationService";
import {SubmissionRepo} from "../db/repo/SubmissionRepo";
import RECORDED_FORMAT from "../model/constants/RecordedFormat";
import {EmailService} from "./EmailService";
import EMAIL_TEMPLATE from "../model/constants/EmailTemplate";
import STATUS from "../model/constants/STATUS";

@Service()
export class SubmissionService implements OnInit {

    private readonly scheduler = new ToadScheduler();

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private customWadEngine: CustomWadEngine;

    @Inject()
    private submissionConfirmationService: SubmissionConfirmationService;

    @Inject()
    private submissionSocket: SubmissionSocket;

    @Inject()
    private logger: Logger;

    @Inject()
    private wadValidationService: WadValidationService;

    @Inject()
    private submissionRepo: SubmissionRepo;

    @Inject()
    private emailService: EmailService;

    @Constant(GlobalEnv.HELP_EMAIL)
    private readonly helpEmail: string;

    public async addEntry(entry: SubmissionModel, customWad?: PlatformMulterFile): Promise<SubmissionModel> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound(false);
        if (!currentActiveRound) {
            throw new NotFound("Cannot add a submission when there are no currently active rounds.");
        }
        if (currentActiveRound.paused) {
            throw new BadRequest("Unable to add entry as the current round is paused.");
        }
        try {
            await this.validateSubmission(entry, currentActiveRound, customWad);
        } catch (e) {
            if (customWad) {
                try {
                    await this.customWadEngine.deleteCustomWad(customWad);
                } catch {
                    this.logger.error(`Unable to delete file ${customWad.path}`);
                }
            }
            throw new BadRequest(e.message);
        }
        if (customWad) {
            try {
                await this.wadValidationService.validateWad(customWad);
            } catch (e) {
                await this.customWadEngine.deleteCustomWad(customWad);
                throw e;
            }
            entry.customWadFileName = customWad.originalname;
        }
        entry.submissionRoundId = currentActiveRound.id;
        const saveEntry = await this.submissionRepo.saveOrUpdateSubmission(entry);
        if (customWad) {
            await this.customWadEngine.moveWad(saveEntry.id, customWad, currentActiveRound.id);
        }
        saveEntry.confirmation = await this.submissionConfirmationService.generateConfirmationEntry(entry.id);
        return saveEntry;
    }

    public async addYoutubeToSubmission(submissionId: number, youtubeLink: string | null): Promise<void> {
        const submission = await this.submissionRepo.retrieveSubmission(submissionId);
        if (!submission) {
            throw new BadRequest(`Unable to find submission of id ${submissionId}.`);
        }
        submission.youtubeLink = youtubeLink;
        await this.submissionRepo.saveOrUpdateSubmission(submission);
    }

    public async modifyStatus(status: SubmissionStatusModel): Promise<void> {
        try {
            await this.submissionRepo.setSubmissionStatus(status);
        } catch (e) {
            throw new BadRequest(e.message, e);
        }
        if (status.status === STATUS.REJECTED) {
            const entry = await this.submissionRepo.retrieveSubmission(status.submissionId);
            if (entry) {
                let body = "Your submission has been rejected during play-though";
                if (status.additionalInfo) {
                    body += ` with comment "${status.additionalInfo}"`;
                }
                await this.emailService.sendMail(entry.submitterEmail, EMAIL_TEMPLATE.DELETED, body);
            }
        }
    }

    public async modifyEntry(entry: Record<string, unknown>): Promise<void> {
        const submission = await this.submissionRepo.retrieveSubmission(Number.parseInt(entry.id as string));

        if (!submission) {
            throw new BadRequest(`Unable to find submission of id ${entry.id}.`);
        }

        if (entry.WADName) {
            submission.wadName = entry.WADName as string;
        }

        if (entry.WAD) {
            submission.wadURL = entry.WAD as string;
        }

        if (entry.level) {
            submission.wadLevel = entry.level as string;
        }

        if (entry.engine) {
            submission.wadEngine = entry.engine as DOOM_ENGINE;
        }

        if (entry.author) {
            submission.submitterAuthor = entry.author === "true";
        }

        if (submission.submitterAuthor && entry.distributable) {
            submission.distributable = entry.distributable === "true";
        }

        if (entry.recordedFormat) {
            submission.recordedFormat = entry.recordedFormat as RECORDED_FORMAT;
        }

        submission.submitterName = entry.authorName as string ?? null;

        await this.submissionRepo.saveOrUpdateSubmission(submission);
    }

    public getEntry(id: number): Promise<SubmissionModel | null> {
        return this.submissionRepo.retrieveSubmission(id);
    }

    public async getAllEntries(roundId = -1): Promise<SubmissionModel[]> {
        if (roundId === -1) {
            const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
            if (!currentActiveRound) {
                throw new BadRequest("No round exists.");
            }
            return currentActiveRound.submissions;
        }
        return this.submissionRepo.getAllSubmissions(roundId);
    }


    public async deleteEntries(ids: number[]): Promise<boolean> {
        const submissionsToDelete = await this.submissionRepo.getSubmissions(ids);
        const pArr: Promise<void>[] = [];

        for (const entry of submissionsToDelete) {
            if (entry.customWadFileName) {
                pArr.push(this.customWadEngine.deleteCustomWad(entry.id, entry.submissionRoundId));
            }
        }

        try {
            await Promise.all(pArr);
        } catch (e) {
            throw new e;
        }

        const remove = await this.submissionRepo.deleteSubmissions(submissionsToDelete);
        if (!remove) {
            return false;
        }

        // email the submitter, but only if the submission was chosen, if it was deleted from an already finished round, do not email
        const emailPromises = submissionsToDelete.map(entry => entry.isChosen ? Promise.resolve() : this.emailService.sendMail(entry.submitterEmail, EMAIL_TEMPLATE.DELETED));
        try {
            await Promise.all(emailPromises);
        } catch (e) {
            this.logger.error("Unable to send submission rejection email", e);
        }
        this.submissionSocket.emitSubmissionDelete(ids);
        return true;
    }

    public $onInit(): void {
        const task = new AsyncTask(
            'cleanOldEntries',
            () => this.scanDb() as Promise<void>
        );
        const job = new SimpleIntervalJob({minutes: 1}, task);
        this.scheduler.addSimpleIntervalJob(job);
    }

    private async isAlreadySubmitted(entry: SubmissionModel): Promise<void> {
        const allSubmissionRounds = await this.submissionRoundService.getAllSubmissionRounds();
        for (const submissionRound of allSubmissionRounds) {
            const allEntries = submissionRound.submissions;
            for (const entryFromRound of allEntries) {
                if (!submissionRound.active && !entryFromRound.isChosen) {
                    continue;
                }
                if ((entryFromRound.wadURL === entry.wadURL || entryFromRound.wadName === entry.wadName) && this.getNumberPart(entryFromRound.wadLevel) === this.getNumberPart(entry.wadLevel)) {
                    let errorMsg = "this wad/map combination already been submitted. Please submit a different map.";
                    if (!submissionRound.active) {
                        errorMsg += ` The map was submitted in: "${submissionRound.name}" at position: ${entryFromRound.playOrder}`;
                    }
                    throw new Error(errorMsg);
                }
            }
        }
    }

    private async validateSubmission(entry: SubmissionModel, round: SubmissionRoundModel, customWad?: PlatformMulterFile): Promise<void> {
        if (!customWad && !entry.wadURL) {
            throw new Error("Either WAD URL or a file must be uploaded.");
        }
        const submitterName = entry.submitterName;
        const email = entry.submitterEmail;
        for (const submission of round.submissions) {
            if (submitterName && submission.submitterName === submitterName || email && submission.submitterEmail === email) {
                throw new Error(`You have already submitted a level. You are only allowed one submission per round. Contact ${this.helpEmail ?? "decino"} to change your submission.`);
            }
        }
        await this.isAlreadySubmitted(entry);
    }

    private getNumberPart(num: string): string {
        const sanitisedN = num.replace(/\D/g, '');
        const parsedInt = Number.parseInt(sanitisedN);
        if (Number.isNaN(parsedInt)) {
            return num;
        }
        return parsedInt.toString();
    }

    private async scanDb(): Promise<unknown> {
        const invalidEntries = await this.submissionRepo.getInvalidSubmissions();
        if (!invalidEntries || invalidEntries.length === 0) {
            return;
        }
        const twentyMins = 1200000;
        const now = Date.now();
        const entriesToDelete: SubmissionModel[] = [];
        for (const entry of invalidEntries) {
            const createdAt = entry?.confirmation?.createdAt?.getTime() ?? null;
            if (createdAt === null) {
                continue;
            }
            if (now - createdAt > twentyMins) {
                entriesToDelete.push(entry);
            }
        }
        if (entriesToDelete.length === 0) {
            return;
        }
        this.logger.info(`Found ${entriesToDelete.length} pending submissions that have expired. Deleting...`);
        const entryIds = entriesToDelete.map(entry => entry.id);
        return this.deleteEntries(entryIds);
    }
}
