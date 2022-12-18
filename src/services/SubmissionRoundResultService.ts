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

    public async generateEntries(count: number | undefined): Promise<SubmissionModel[]> {
        const allEntries = await this.submissionService.getAllEntries();
        const mergedEntries: Map<string, SubmissionModel[]> = new Map();

        for (const entry of allEntries) {
            if (!entry.submissionValid) {
                continue;
            }
            const wadIdentifier = entry.wadURL ? entry.wadURL : entry.wadName;
            if (mergedEntries.has(wadIdentifier)) {
                mergedEntries.get(wadIdentifier)?.push(entry);
            } else {
                mergedEntries.set(wadIdentifier, [entry]);
            }
        }
        const keysToGet = this.getMultipleRandom([...mergedEntries.keys()], count);
        const chosenEntries = keysToGet.flatMap(key => mergedEntries.get(key)) as SubmissionModel[];
        return this.getMultipleRandom(chosenEntries, count);
    }

    public async submitEntries(enryIds: number[]): Promise<void> {
        const activeRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        if (!activeRound) {
            return;
        }
        const entries: SubmissionModel[] = [];
        for (const entryId of enryIds) {
            const entry = activeRound.submissions.find(submission => submission.id === entryId);
            if (!entry) {
                throw new InternalServerError(`Entry if id ${entryId} not found in current active round`);
            }
            entry.chosenRoundId = activeRound.id;
            entries.push(entry);
        }
        const repo = this.ds.getRepository(SubmissionModel);
        await repo.save(entries);
        await this.submissionRoundService.endActiveSubmissionRound();
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
