import {Inject, Service} from "@tsed/di";
import {SubmissionModel} from "../model/db/Submission.model";
import {SubmissionService} from "./SubmissionService";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {SubmissionRoundService} from "./SubmissionRoundService";
import {InternalServerError} from "@tsed/exceptions";

@Service()
export class SubmissionRoundResultService {

    @Inject()
    private submissionService: SubmissionService;

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    private readonly entryCache: Map<string, SubmissionModel[]> = new Map();

    public async buildResultSet(): Promise<void> {
        this.entryCache.clear();
        const allEntries = await this.submissionService.getAllEntries();
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

    public generateEntries(count: number | undefined): SubmissionModel[] {
        if (this.entryCache.size === 0) {
            throw new Error("Unable to generate entries as the cache has not been built");
        }
        const keysToGet = this.getMultipleRandom([...this.entryCache.keys()], count);
        const chosenEntries = keysToGet.flatMap(key => this.entryCache.get(key)) as SubmissionModel[];
        return this.getMultipleRandom(chosenEntries, count);
    }

    public async submitEntries(entryIds: number[]): Promise<void> {
        const activeRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        if (!activeRound) {
            return;
        }
        const entries: SubmissionModel[] = [];
        for (const entryId of entryIds) {
            const entry = activeRound.submissions.find(submission => submission.id === entryId);
            if (!entry) {
                throw new InternalServerError(`Entry of ID ${entryId} is not found in current active round.`);
            }
            entry.chosenRoundId = activeRound.id;
            entries.push(entry);
        }
        const repo = this.ds.getRepository(SubmissionModel);
        await repo.save(entries);
        await this.submissionRoundService.endActiveSubmissionRound();
        this.entryCache.clear();
    }

    public async getAllSubmissionRoundResults(): Promise<SubmissionRoundModel[]> {
        const allNonActiveRounds = await this.submissionRoundService.getAllSubmissionRounds(false);
        // this should be done as an inner select on the table join, but this ORM does not support this yet
        const filteredResult = allNonActiveRounds.map(value => {
            value.submissions = value.submissions.filter(submission => !!submission.chosenRoundId);
            return value;
        });
        return filteredResult ?? [];
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
