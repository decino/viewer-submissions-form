import {IndexDto} from "./IndexDto";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";

export class AdminDto extends IndexDto {
    public constructor(currentActiveRound: SubmissionRoundModel | null,
                       previousRounds: SubmissionRoundModel[]) {
        super(currentActiveRound, previousRounds);
    }
}
