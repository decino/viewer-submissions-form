import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import DOOM_ENGINE from "../model/constants/DoomEngine";
import GZDOOM_ACTIONS from "../model/constants/GZDoomActions";
import {ObjectUtils} from "../utils/Utils";

export class IndexDto {
    public constructor(public currentActiveRound: SubmissionRoundModel | null,
                       public previousRounds: SubmissionRoundModel[]) {
    }

    public get doomEngines(): Record<string, unknown> {
        return ObjectUtils.getEnumAsObject(DOOM_ENGINE);
    }

    public get gzActions(): Record<string, unknown> {
        return ObjectUtils.getEnumAsObject(GZDOOM_ACTIONS);
    }

    public getRoundDateAsString(round: SubmissionRoundModel): string {
        const createdAt = round.createdAt;
        const date = createdAt.getUTCDate();
        const month = createdAt.getUTCMonth();
        const year = createdAt.getUTCFullYear();
        const time = `${(createdAt.getUTCHours() < 10 ? '0' : '') + createdAt.getUTCHours()}:${(createdAt.getUTCMinutes() < 10 ? '0' : '') + createdAt.getUTCMinutes()}`;
        const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${date}<sup>${this.nth(date)}</sup> of ${monthName[month]} ${year} at ${time} UTC`;
    }

    private nth(d: number): string {
        if (d > 3 && d < 21) {
            return 'th';
        }
        switch (d % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    }

    private getMostSubmittedWads(): string | null {
        if (!this.currentActiveRound) {
            return null;
        }
        const mappedArr = this.currentActiveRound.submissions.map(submission => submission.wadName);
        return mappedArr.sort((a, b) =>
            mappedArr.filter(v => v === a).length
            - mappedArr.filter(v => v === b).length
        ).pop() ?? null;
    }
}

