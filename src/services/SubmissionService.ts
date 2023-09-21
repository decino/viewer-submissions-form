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
            this.validateSubmission(entry, currentActiveRound, customWad);
            await this.hasBeenPreviouslyPlayed(entry);
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
            const foo = await this.submissionRepo.setSubmissionStatus(status);
            console.log(foo);
        } catch (e) {
            throw new BadRequest(e.message, e);
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

    private async hasBeenPreviouslyPlayed(entry: SubmissionModel): Promise<void> {
        const previousRounds = await this.submissionRoundService.getAllSubmissionRounds(false);
        for (const previousRound of previousRounds) {
            const chosenEntries = previousRound.submissions.filter(submission => submission.isChosen);
            for (const chosenEntry of chosenEntries) {
                if ((chosenEntry.wadURL === entry.wadURL || chosenEntry.wadName === entry.wadName) && this.getNumberPart(chosenEntry.wadLevel) === this.getNumberPart(entry.wadLevel)) {
                    throw new Error("This map has been previously played and can not be submitted");
                }
            }
        }
    }

    private validateSubmission(entry: SubmissionModel, round: SubmissionRoundModel, customWad?: PlatformMulterFile): void {
        if (!customWad && !entry.wadURL) {
            throw new Error("Either WAD URL or a file must be uploaded.");
        }
        const wadUrl = entry.wadURL;
        const submitterName = entry.submitterName;
        const level = this.getNumberPart(entry.wadLevel);
        const email = entry.submitterEmail;
        const wadName = entry.wadName;
        for (const submission of round.submissions) {
            if (submitterName && submission.submitterName === submitterName || email && submission.submitterEmail === email) {
                throw new Error(`You have already submitted a level. You are only allowed one submission per round. Contact ${this.helpEmail ?? "decino"} to change your submission.`);
            }
            if ((submission.wadURL === wadUrl || submission.wadName === wadName) && this.getNumberPart(submission.wadLevel) === level) {
                throw new Error("This level for this WAD has already been submitted. Please submit a different map.");
            }
        }
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
