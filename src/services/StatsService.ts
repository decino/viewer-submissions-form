import { SubmissionService } from "./SubmissionService.js";
import { Inject, Service } from "@tsed/di";
import { PublicStatsDto } from "../DTO/PublicStatsDto.js";
import { SubmissionRoundService } from "./SubmissionRoundService.js";
import { Builder } from "builder-pattern";

@Service()
export class StatsService {
    public constructor(
        @Inject() private submissionService: SubmissionService,
        @Inject() private submissionRoundService: SubmissionRoundService,
    ) {}

    public async getStats(round: number): Promise<PublicStatsDto> {
        const statsBuilder = Builder(PublicStatsDto);

        const submissions = await this.submissionService.getAllEntries(round, true);

        if (submissions.length === 0) {
            return statsBuilder.build();
        }

        // Record format stats
        const formatCounts = this.groupAndCount(submissions, sub => sub.recordedFormat, {
            Practised: 0,
            Blind: 0,
        } as const);
        statsBuilder.recordFormat({
            practised: formatCounts.Practised,
            blind: formatCounts.Blind,
        });

        // Author stats
        const authorCounts = this.groupAndCount(submissions, sub => (sub.submitterAuthor ? "yes" : "no"), {
            yes: 0,
            no: 0,
        } as const);
        statsBuilder.isAuthor({
            yes: authorCounts.yes,
            no: authorCounts.no,
        });

        // Distributable stats
        const distributableCounts = this.groupAndCount(submissions, sub => (sub.shareable() ? "yes" : "no"), {
            yes: 0,
            no: 0,
        } as const);
        statsBuilder.distributable({
            yes: distributableCounts.yes,
            no: distributableCounts.no,
        });

        return statsBuilder.build();
    }

    private groupAndCount<T, K extends string>(
        items: T[],
        keyFn: (item: T) => K,
        defaultKeys: Record<K, number>,
    ): Record<K, number> {
        const result = { ...defaultKeys };

        for (const item of items) {
            const key = keyFn(item);
            result[key] = (result[key] ?? 0) + 1;
        }

        return result;
    }
}
