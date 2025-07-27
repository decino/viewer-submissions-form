import { SubmissionRoundModel } from "../../model/db/SubmissionRound.model.js";
import { AutoInjectable, Inject } from "@tsed/di";
import { SubmissionRoundService } from "../../services/SubmissionRoundService.js";

@AutoInjectable()
export class StatsDto {
    public readonly mostSubmittedWad: string;
    public readonly mostSubmittedWadPercentage: number;

    public constructor(
        private activeRound: SubmissionRoundModel | null = null,
        private previousRounds: SubmissionRoundModel[],
        @Inject() private submissionRoundService?: SubmissionRoundService,
    ) {}

    private async getMostSubmittedWadPercentageRounded(): Promise<number | null> {
        if (!this.activeRound) {
            return null;
        }
        const validSubmissions = this.activeRound.validAndVerifiedSubmissions;
        const totalSubmissions = validSubmissions.length;
        const mostSubmittedWad = await this.getMostSubmittedWad();

        if (totalSubmissions > 0 && mostSubmittedWad) {
            const mostSubmittedWadCount = validSubmissions.filter(
                submission => submission.wadName === mostSubmittedWad,
            ).length;
            return Math.round((mostSubmittedWadCount / totalSubmissions) * 100 * 100) / 100;
        }
        return 0;
    }

    private getMostSubmittedWad(): Promise<string | null> {
        return this.submissionRoundService!.getMostSubmittedWadName();
    }

    private get hasActiveRound(): boolean {
        return this.activeRound !== null;
    }

    public async merge(obj: Record<string, unknown>): Promise<void> {
        if (this.hasActiveRound) {
            const mostSubmittedWad = (await this.getMostSubmittedWad())!;
            const mostSubmittedWadPercentage = (await this.getMostSubmittedWadPercentageRounded())!;

            obj["stats"] = {
                mostSubmittedWad,
                mostSubmittedWadPercentage,
            };
        }
    }
}
