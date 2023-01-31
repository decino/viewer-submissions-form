import {Inject, OnInit, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource, In} from "typeorm";
import {SubmissionModel} from "../model/db/Submission.model";
import {SubmissionRoundService} from "./SubmissionRoundService";
import {BadRequest, NotFound} from "@tsed/exceptions";
import {Logger, PlatformMulterFile} from "@tsed/common";
import {CustomWadEngine} from "../engine/CustomWadEngine";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {SubmissionConfirmationService} from "./SubmissionConfirmationService";
import {AsyncTask, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import {SubmissionModification} from "../utils/typeings";
import DOOM_ENGINE from "../model/constants/DoomEngine";
import {SubmissionSocket} from "./socket/SubmissionSocket";

@Service()
export class SubmissionService implements OnInit {

    private readonly scheduler = new ToadScheduler();

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

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

    public addEntry(entry: SubmissionModel, customWad?: PlatformMulterFile): Promise<SubmissionModel> {
        return this.ds.manager.transaction(async entityManager => {
            const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound(false);
            if (!currentActiveRound) {
                throw new NotFound("Cannot add a submission when there are no currently active rounds.");
            }
            if (currentActiveRound.paused) {
                throw new BadRequest("Unable to add entry as the current round is paused.");
            }
            try {
                this.validateSubmission(entry, currentActiveRound, customWad);
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
                const allowed = await this.customWadEngine.validateFile(customWad);
                if (!allowed) {
                    await this.customWadEngine.deleteCustomWad(customWad);
                    throw new BadRequest("Invalid file: header mismatch.");
                }
                entry.customWadFileName = customWad.originalname;
            }
            entry.submissionRoundId = currentActiveRound.id;
            const repo = entityManager.getRepository(SubmissionModel);
            const saveEntry = await repo.save(entry);
            if (customWad) {
                await this.customWadEngine.moveWad(saveEntry.id, customWad, currentActiveRound.id);
            }
            saveEntry.confirmation = await this.submissionConfirmationService.generateConfirmationEntry(entry.submitterEmail, entry.submissionRoundId);
            return saveEntry;
        });
    }

    public async modifyEntry(entry: Record<string, unknown>): Promise<void> {
        const repo = this.ds.getRepository(SubmissionModel);
        const mappedObj: SubmissionModification = {};
        if (entry.WADName) {
            mappedObj["wadName"] = entry.WADName as string;
        }
        if (entry.WAD) {
            mappedObj["wadURL"] = entry.WAD as string;
        }
        if (entry.level) {
            mappedObj["wadLevel"] = entry.level as string;
        }
        if (entry.engine) {
            mappedObj["wadEngine"] = entry.engine as DOOM_ENGINE;
        }
        mappedObj["submitterName"] = entry.authorName as string ?? null;

        const model = repo.create(mappedObj);
        await repo.update({
            id: Number.parseInt(entry.id as string)
        }, model);
    }

    public getEntry(id: number): Promise<SubmissionModel | null> {
        const repo = this.ds.getRepository(SubmissionModel);
        return repo.findOne({
            relations: ["submissionRound"],
            where: {
                id
            }
        });
    }

    public async getAllEntries(roundId = -1): Promise<SubmissionModel[]> {
        if (roundId === -1) {
            const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
            if (!currentActiveRound) {
                throw new Error("No round exists.");
            }
            roundId = currentActiveRound.id;
        }
        const repo = this.ds.getRepository(SubmissionModel);
        const entries = await repo.find({
            where: {
                submissionRoundId: roundId
            }
        });
        return entries ?? [];
    }

    public async deleteEntries(ids: number[]): Promise<SubmissionModel[] | null> {
        const repo = this.ds.getRepository(SubmissionModel);

        const entries = await repo.find({
            where: {
                id: In(ids)
            }
        });
        if (!entries || entries.length === 0) {
            return null;
        }
        const pArr: Promise<void>[] = [];
        for (const entry of entries) {
            if (entry.customWadFileName) {
                pArr.push(this.customWadEngine.deleteCustomWad(entry.id, entry.submissionRoundId));
            }
        }
        await Promise.all(pArr);
        const remove = await repo.remove(entries);
        this.submissionSocket.emitSubmissionDelete(ids);
        return remove;
    }

    public $onInit(): void {
        const task = new AsyncTask(
            'cleanOldEntries',
            () => this.scanDb() as Promise<void>
        );
        const job = new SimpleIntervalJob({minutes: 1,}, task);
        this.scheduler.addSimpleIntervalJob(job);
    }

    private validateSubmission(entry: SubmissionModel, round: SubmissionRoundModel, customWad?: PlatformMulterFile): void {
        if (!customWad && !entry.wadURL) {
            throw new Error("Either WAD URL or a file must be uploaded.");
        }
        const wadUrl = entry.wadURL;
        const submitterName = entry.submitterName;
        const level = entry.wadLevel;
        const email = entry.submitterEmail;
        const wadName = entry.wadName;
        for (const submission of round.submissions) {
            if (submitterName && submission.submitterName === submitterName || email && submission.submitterEmail === email) {
                throw new Error(`You have already submitted a level. You are only allowed one submission per round. Contact ${process.env.HELP_EMAIL ?? "decino"} to change your submission.`);
            }
            if ((submission.wadURL === wadUrl || submission.wadName === wadName) && submission.wadLevel === level) {
                throw new Error("This level for this WAD has already been submitted. Please submit a different map.");
            }
        }
    }

    private scanDb(): Promise<unknown> {
        const submissionModelRepository = this.ds.getRepository(SubmissionModel);
        return submissionModelRepository.find({
            where: {
                submissionValid: false
            },
            relations: ["confirmation"]
        }).then(entries => {
            if (!entries || entries.length === 0) {
                return;
            }
            const twentyMins = 1200000;
            const now = Date.now();
            const entriesToDelete: SubmissionModel [] = [];
            for (const entry of entries) {
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
        });
    }
}
