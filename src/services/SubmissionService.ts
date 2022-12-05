import {Inject, OnInit, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SubmissionModel} from "../model/db/Submission.model";
import {SubmissionRoundService} from "./SubmissionRoundService";
import {BadRequest, NotFound} from "@tsed/exceptions";
import {Logger, PlatformMulterFile} from "@tsed/common";
import {CustomWadEngine} from "../engine/CustomWadEngine";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {SubmissionConfirmationService} from "./SubmissionConfirmationService";
import {AsyncTask, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import {EmailService} from "./EmailService";

@Service()
export class SubmissionService implements OnInit {

    private scheduler = new ToadScheduler();

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private customWadEngine: CustomWadEngine;

    @Inject()
    private submissionConfirmationService: SubmissionConfirmationService;

    @Inject()
    private emailService: EmailService;

    @Inject()
    private logger: Logger;

    public addEntry(entry: SubmissionModel, customWad?: PlatformMulterFile): Promise<SubmissionModel> {
        return this.ds.manager.transaction(async entityManager => {
            const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
            if (!currentActiveRound) {
                throw new NotFound("can not add when there are no currently active rounds");
            }
            if (!this.canAddEntry(entry, currentActiveRound)) {
                throw new BadRequest("This level for this wad has already been requested, please try a different map or wad, or you have already submitted a request");
            }
            if (customWad) {
                const allowed = await this.customWadEngine.validateFile(customWad);
                if (!allowed) {
                    await this.customWadEngine.deleteCustomWad(customWad);
                    throw new BadRequest("invalid file, header mismatch");
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
            await this.emailService.sendConfirmationEmail(saveEntry.confirmation);
            return saveEntry;
        });
    }

    public async getEntry(id: number): Promise<SubmissionModel | null> {
        const repo = this.ds.getRepository(SubmissionModel);
        const entry = await repo.findOne({
            where: {
                id
            }
        });
        if (!entry) {
            return null;
        }
        return entry;
    }

    public async getAllEntries(roundId: number): Promise<SubmissionModel[]> {
        const repo = this.ds.getRepository(SubmissionModel);
        const entries = await repo.find({
            where: {
                submissionRoundId: roundId
            }
        });
        return entries ?? [];
    }

    public async deleteEntry(id: number): Promise<SubmissionModel | null> {
        const repo = this.ds.getRepository(SubmissionModel);
        const entry = await repo.findOne({
            where: {
                id
            }
        });
        if (!entry) {
            return null;
        }
        const removedItem = await repo.remove(entry);
        if (entry.customWadFileName) {
            await this.customWadEngine.deleteCustomWad(id, entry.submissionRoundId);
        }
        return removedItem;
    }

    public $onInit(): void {
        const task = new AsyncTask(
            'cleanOldEntries',
            () => this.scanDb() as Promise<void>
        );
        const job = new SimpleIntervalJob({minutes: 1,}, task);
        this.scheduler.addSimpleIntervalJob(job);
    }

    private canAddEntry(entry: SubmissionModel, round: SubmissionRoundModel): boolean {
        const wadUrl = entry.wadURL;
        const submitterName = entry.submitterName;
        const level = entry.wadLevel;
        const email = entry.submitterEmail;
        const alreadySubmitted = round.submissions.find(
            entry => (entry.wadURL === wadUrl && entry.wadLevel === level)
                || entry.submitterName === submitterName
                || entry.submitterEmail === email)
        ;
        return !alreadySubmitted;
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
                const createdAt = entry.confirmation.createdAt.getTime();
                if (now - createdAt > twentyMins) {
                    entriesToDelete.push(entry);
                }
            }
            if (entriesToDelete.length === 0) {
                return;
            }
            this.logger.info(`found ${entriesToDelete.length} pending submission that has expired, deleting...`);
            const pArr = entriesToDelete.map(entry => this.deleteEntry(entry.id));
            return Promise.all(pArr);
        });
    }
}
