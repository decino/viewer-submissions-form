import { Constant, Inject, Service } from "@tsed/di";
import { SubmissionModel } from "../model/db/Submission.model";
import { SubmissionRoundService } from "./SubmissionRoundService.js";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { Logger, PlatformMulterFile } from "@tsed/common";
import { CustomWadEngine } from "../engine/CustomWadEngine.js";
import { SubmissionRoundModel } from "../model/db/SubmissionRound.model.js";
import { SubmissionConfirmationService } from "./SubmissionConfirmationService.js";
import DOOM_ENGINE from "../model/constants/DoomEngine.js";
import { SubmissionSocket } from "./socket/SubmissionSocket.js";
import { SubmissionStatusModel } from "../model/db/SubmissionStatus.model.js";
import GlobalEnv from "../model/constants/GlobalEnv.js";
import { WadValidationService } from "./WadValidationService.js";
import { SubmissionRepo } from "../db/repo/SubmissionRepo.js";
import RECORDED_FORMAT from "../model/constants/RecordedFormat.js";
import { EmailService } from "./EmailService.js";
import EMAIL_TEMPLATE from "../model/constants/EmailTemplate.js";
import STATUS from "../model/constants/STATUS.js";
import { RunEvery } from "../model/di/decorators/Cron.js";
import METHOD_EXECUTOR_TIME_UNIT from "../model/constants/METHOD_EXECUTOR_TIME_UNIT.js";

@Service()
export class SubmissionService {
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
            entry.wadURL = null;
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
                await this.emailService.sendMail(entry.submitterEmail, EMAIL_TEMPLATE.REJECTED, body);
            }
        }
    }

    public async modifyEntry(entry: Record<string, unknown>, replacementWad?: PlatformMulterFile): Promise<void> {
        const submission = await this.submissionRepo.retrieveSubmission(Number.parseInt(entry.id as string));

        if (!submission) {
            throw new BadRequest(`Unable to find submission of id ${entry.id}.`);
        }

        if (replacementWad) {
            submission.wadURL = null;
            submission.customWadFileName = replacementWad.originalname;
            const submissionRound = await submission.submissionRound;
            await this.customWadEngine.moveWad(submission.id, replacementWad, submissionRound.id);
        } else {
            if (entry.WADName) {
                submission.wadName = entry.WADName as string;
            }

            if (entry.WAD) {
                if (submission.customWadFileName) {
                    await this.customWadEngine.deleteCustomWad(submission.id, submission.submissionRoundId);
                }
                submission.customWadFileName = null;
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

            submission.submitterName = (entry.authorName as string) ?? null;
        }

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

    public async deleteEntries(ids: number[], notify = true): Promise<boolean> {
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
            throw new e();
        }

        const remove = await this.submissionRepo.deleteSubmissions(submissionsToDelete);
        if (!remove) {
            return false;
        }

        if (notify) {
            // email the submitter, but only if the submission was chosen, if it was deleted from an already finished round, do not email
            const emailPromises = submissionsToDelete.map(entry =>
                entry.isChosen
                    ? Promise.resolve()
                    : this.emailService.sendMail(entry.submitterEmail, EMAIL_TEMPLATE.DELETED),
            );
            try {
                await Promise.all(emailPromises);
            } catch (e) {
                this.logger.error("Unable to send submission rejection email", e);
            }
        }

        this.submissionSocket.emitSubmissionDelete(ids);
        return true;
    }

    private async isAlreadySubmitted(entry: SubmissionModel): Promise<void> {
        const allSubmissionRounds = await this.submissionRoundService.getAllSubmissionRounds();
        for (const submissionRound of allSubmissionRounds) {
            const allEntries = submissionRound.submissions;
            for (const entryFromRound of allEntries) {
                if (!submissionRound.active && !entryFromRound.isChosen) {
                    continue;
                }
                if (
                    (entryFromRound.wadURL === entry.wadURL || entryFromRound.wadName === entry.wadName) &&
                    this.getNumberPart(entryFromRound.wadLevel) === this.getNumberPart(entry.wadLevel)
                ) {
                    let errorMsg = "this wad/map combination already been submitted. Please submit a different map.";
                    if (!submissionRound.active) {
                        errorMsg += ` The map was submitted in: "${submissionRound.name}" at position: ${entryFromRound.playOrder}`;
                    }
                    throw new Error(errorMsg);
                }
            }
        }
    }

    private async validateSubmission(
        entry: SubmissionModel,
        round: SubmissionRoundModel,
        customWad?: PlatformMulterFile,
    ): Promise<void> {
        if (!customWad && !entry.wadURL) {
            throw new Error("Either WAD URL or a file must be uploaded.");
        }
        const submitterName = entry.submitterName;
        const email = entry.submitterEmail;
        for (const submission of round.submissions) {
            if (
                (submitterName != null && submission.submitterName?.toLowerCase() === submitterName.toLowerCase()) ||
                submission.submitterEmail.toLowerCase() === email.toLowerCase()
            ) {
                let info = `duplicate submission submitted. email: "${email} matches submission with ID ${submission.id}"`;
                if (submitterName) {
                    info += ` with submission name ${submitterName}`;
                }
                this.logger.info(info);
                this.logger.info(submission);
                this.logger.info(entry);
                throw new Error(
                    `You have already submitted a level. You are only allowed one submission per round. Contact ${this.helpEmail ?? "decino"} to change your submission.`,
                );
            }
        }
        await this.isAlreadySubmitted(entry);
    }

    private getNumberPart(num: string): string {
        const sanitisedN = num.replace(/\D/g, "");
        const parsedInt = Number.parseInt(sanitisedN);
        if (Number.isNaN(parsedInt)) {
            return num.toLowerCase();
        }
        return parsedInt.toString();
    }

    @RunEvery(1, METHOD_EXECUTOR_TIME_UNIT.minutes, true)
    private async detectAndRemoveExpiredSubmissions(): Promise<void> {
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
        this.logger.info(
            `Deleting ${entriesToDelete.length} submissions with conformations ${entriesToDelete.map(s => s.confirmation!.confirmationUid).join(", ")} as they have expired...`,
        );
        const entryIds = entriesToDelete.map(entry => entry.id);
        await this.deleteEntries(entryIds, false);
    }
}
