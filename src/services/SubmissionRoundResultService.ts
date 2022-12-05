import {Inject, Service} from "@tsed/di";
import {SubmissionModel} from "../model/db/Submission.model";
import process from "process";
import {SubmissionService} from "./SubmissionService";

@Service()
export class SubmissionRoundResultService {

    @Inject()
    private submissionService: SubmissionService;

    public async generateEntries(count: number = Number.parseInt(process.env.ENTRIES_TO_GENERATE as string)): Promise<SubmissionModel[]> {
        const allEntries = await this.submissionService.getAllEntries();
        const mergedEntries: Map<string, SubmissionModel[]> = new Map();

        for (const entry of allEntries) {
            if (!entry.submissionValid) {
                continue;
            }
            const wadIdentifier = entry.customWadFileName ? entry.customWadFileName : entry.wadURL;
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

    private getMultipleRandom<T>(arr: T[], num = -1): T[] {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return num === -1 ? shuffled : shuffled.slice(0, num);
    }

}
