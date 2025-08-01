import { Inject, Service } from "@tsed/di";
import { SubmissionModel } from "../model/db/Submission.model";
import { SubmissionService } from "./SubmissionService.js";
import { SubmissionRoundModel } from "../model/db/SubmissionRound.model.js";
import { SubmissionRoundService } from "./SubmissionRoundService.js";
import { BadRequest, InternalServerError } from "@tsed/exceptions";
import { SubmissionStatusModel } from "../model/db/SubmissionStatus.model.js";
import { SubmissionRepo } from "../db/repo/SubmissionRepo.js";

@Service()
export class SubmissionRoundResultService {
    @Inject()
    private submissionService: SubmissionService;

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private submissionRepo: SubmissionRepo;

    // Map of wad names to an array of submissions
    private readonly entryCache: Map<string, SubmissionModel[]> = new Map();

    public async buildResultSet(entries?: SubmissionModel[]): Promise<void> {
        this.entryCache.clear();
        let allEntries: SubmissionModel[];
        if (entries) {
            allEntries = entries;
        } else {
            // get all tbe entries for this round
            allEntries = await this.submissionService.getAllEntries(-1, true);
        }
        if (allEntries.length === 0) {
            throw new BadRequest("There are no entries in this round!");
        }
        for (const entry of allEntries) {
            if (!entry.isSubmissionValidAndVerified()) {
                // invalid entry? skip it
                continue;
            }

            // get the WAD name from the entry
            const wadIdentifier = entry.wadName.toLowerCase();

            // group all the wads by wad name. so multiple entries of the same wad are grouped in to an array
            if (this.entryCache.has(wadIdentifier)) {
                this.entryCache.get(wadIdentifier)?.push(entry);
            } else {
                this.entryCache.set(wadIdentifier, [entry]);
            }
        }
    }

    public generateEntries(count: number): SubmissionModel[] {
        if (this.entryCache.size === 0) {
            throw new Error("Unable to generate entries as the cache has not been built.");
        }

        // get a random unique array of wad names
        const wadNames = this.getMultipleRandom([...this.entryCache.keys()], count);

        // transform the wad names above into actual submissions (maps)
        const chosenEntries = wadNames.flatMap(wadName => this.entryCache.get(wadName) ?? []);

        // get a unique random array of the maps from above
        const results = this.getMultipleRandom(chosenEntries, count);

        // remove that wad from the result set, only one wad is allowed
        for (const wadName of wadNames) {
            this.entryCache.delete(wadName);
        }
        return results;
    }

    public async submitEntries(entryIds: number[], round?: SubmissionRoundModel, append = false): Promise<void> {
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
            if (append) {
                const playOrders = activeRound.submissions
                    .filter(submission => submission.isChosen)
                    .map(submission => submission.playOrder!);
                const max = Math.max(...playOrders);
                entry.playOrder = max + 1;
            } else {
                entry.playOrder = i + 1;
            }
            entry.isChosen = true;
            if (!entry.status) {
                entry.status = new SubmissionStatusModel();
            }
            entries.push(entry);
        }
        await this.submissionRepo.saveOrUpdateSubmissions(entries);
        if (!append) {
            await this.submissionRoundService.endActiveSubmissionRound();
        }
        this.entryCache.clear();
    }

    public async getAllSubmissionRoundResults(): Promise<SubmissionRoundModel[]> {
        const allNonActiveRounds = await this.submissionRoundService.getAllSubmissionRounds(false);
        return allNonActiveRounds ?? [];
    }

    public async addRandomEntry(roundId: number): Promise<SubmissionModel | null> {
        const round = await this.submissionRoundService.getSubmissionRound(roundId);
        if (!round) {
            throw new BadRequest(`Round ${roundId} does not exist.`);
        }
        if (round.submissions.length === 0) {
            return null;
        }

        const chosenWadNames = round.submissions
            .filter(submission => submission.isChosen)
            .map(submission => submission.wadName.toLowerCase());

        const filteredSubmissions = round.submissions.filter(
            submission => !submission.isChosen && !chosenWadNames.includes(submission.wadName.toLowerCase()),
        );

        await this.buildResultSet(filteredSubmissions);
        const entry = this.generateEntries(1)[0];
        await this.submitEntries([entry.id], round, true);
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
