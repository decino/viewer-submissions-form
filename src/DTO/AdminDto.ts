import { IndexDto } from "./IndexDto.js";
import { SubmissionRoundModel } from "../model/db/SubmissionRound.model";
import { SubmissionModel } from "../model/db/Submission.model.js";
import { WadValidationService } from "../services/WadValidationService.js";

export class AdminDto extends IndexDto {
    public constructor(
        currentActiveRound: SubmissionRoundModel | null,
        previousRounds: SubmissionRoundModel[],
        wadValidationService: WadValidationService,
    ) {
        super(currentActiveRound, previousRounds, wadValidationService);
        if (this.currentActiveRound) {
            this.currentActiveRound.submissions = this.currentActiveRound.submissions.filter(
                submission => submission.submissionValid,
            );
        }
    }

    public get unverifiedSubmissions(): SubmissionModel[] {
        if (!this.currentActiveRound) {
            return [];
        }
        return this.currentActiveRound.submissions.filter(
            submission => submission.submissionValid && !submission.verified,
        );
    }

    public get submissions(): SubmissionModel[] {
        if (!this.currentActiveRound) {
            return [];
        }
        return this.currentActiveRound.submissions.filter(submission => submission.isSubmissionValidAndVerified());
    }
}
