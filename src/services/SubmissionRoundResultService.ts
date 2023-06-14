import {Inject, Service} from "@tsed/di";
import {SubmissionModel} from "../model/db/Submission.model";
import {SubmissionService} from "./SubmissionService";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {SubmissionRoundService} from "./SubmissionRoundService";
import {BadRequest, InternalServerError} from "@tsed/exceptions";
import {SubmissionStatusModel} from "../model/db/SubmissionStatus.model";

@Service()
export class SubmissionRoundResultService {

    @Inject()
    private submissionService: SubmissionService;

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    private readonly entryCache: Map<string, SubmissionModel[]> = new Map();

    public async buildResultSet(entries?: SubmissionModel[]): Promise<void> {
        this.entryCache.clear();
        let allEntries: SubmissionModel[];
        if (entries) {
            allEntries = entries;
        } else {
            allEntries = await this.submissionService.getAllEntries();
        }
        for (const entry of allEntries) {
            if (!entry.submissionValid) {
                continue;
            }
            const wadIdentifier = entry.wadName;
            if (this.entryCache.has(wadIdentifier)) {
                this.entryCache.get(wadIdentifier)?.push(entry);
            } else {
                this.entryCache.set(wadIdentifier, [entry]);
            }
        }
    }

    public generateEntries(count: number): SubmissionModel[] {
        if (this.entryCache.size === 0) {
            throw new Error("Unable to generate entries as the cache has not been built");
        }
        const keysToGet = this.getMultipleRandom([...this.entryCache.keys()], count);
        const chosenEntries = keysToGet.flatMap(key => this.entryCache.get(key)) as SubmissionModel[];
        return this.getMultipleRandom(chosenEntries, count);
    }

    public async submitEntries(entryIds: number[], round?: SubmissionRoundModel): Promise<void> {
        let activeRound: SubmissionRoundModel | null;
        if (round) {
            activeRound = round;
        } else {
            activeRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        }
        if (!activeRound) {
            return;
        }
        const entries: SubmissionModel[] = [];
        for (let i = 0; i < entryIds.length; i++) {
            const entryId = entryIds[i];
            const entry = activeRound.submissions.find(submission => submission.id === entryId);
            if (!entry) {
                throw new InternalServerError(`Entry of ID ${entryId} is not found in current active round.`);
            }
            entry.playOrder = i + 1;
            entry.isChosen = true;
            if (!entry.status) {
                entry.status = this.ds.manager.create(SubmissionStatusModel);
            }
            entries.push(entry);
        }
        await this.ds.manager.save(SubmissionModel, entries);
        await this.submissionRoundService.endActiveSubmissionRound();
        this.entryCache.clear();
    }

    public async getAllSubmissionRoundResults(): Promise<SubmissionRoundModel[]> {
        const allNonActiveRounds = await this.submissionRoundService.getAllSubmissionRounds(false);
        // this should be done as an inner select on the table join, but this ORM does not support this yet
        const filteredResult = allNonActiveRounds.map(value => {
            value.submissions = value.submissions.filter(submission => submission.isChosen);
            return value;
        });
        return filteredResult ?? [];
    }

    public async addRandomEntry(roundId: number): Promise<SubmissionModel> {
        const round = await this.submissionRoundService.getSubmissionRound(roundId);
        if (!round) {
            throw new BadRequest(`Round ${roundId} does not exist`);
        }
        await this.buildResultSet(round.submissions);
        const entry = this.generateEntries(1)[0];
        await this.submitEntries([entry.id], round);
        return entry;
    }

    private getMultipleRandom<T>(array: T[], num = -1): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return num === -1 ? shuffled : shuffled.slice(0, num);
    }
}
