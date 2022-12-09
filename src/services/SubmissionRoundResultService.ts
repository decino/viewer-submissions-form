import {Inject, Service} from "@tsed/di";
import {SubmissionModel} from "../model/db/Submission.model";
import process from "process";
import {SubmissionService} from "./SubmissionService";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {SubmissionRoundService} from "./SubmissionRoundService";

@Service()
export class SubmissionRoundResultService {

    @Inject()
    private submissionService: SubmissionService;

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    public async generateEntries(count: number = Number.parseInt(process.env.ENTRIES_TO_GENERATE as string)): Promise<SubmissionModel[]> {
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

    public async getAllSubmissionRoundResults(): Promise<SubmissionRoundModel[]> {
        const allNonActiveRounds = await this.submissionRoundService.getAllSubmissionRounds(false);
        // this should be done as an inner select on the table join, but this ORM does not support this yet
        const filteredResult = allNonActiveRounds.map(value => {
            value.submissions = value.submissions.filter(submission => !!submission.chosenRoundId);
            return value;
        });
        return filteredResult ?? [];
    }

    public async submitEntries(entries: SubmissionModel[]): Promise<void> {
        const activeRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        if (!activeRound) {
            return;
        }
        for (const entry of entries) {
            entry.chosenRoundId = activeRound.id;
        }
        const repo = this.ds.getRepository(SubmissionModel);
        await repo.save(entries);
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
