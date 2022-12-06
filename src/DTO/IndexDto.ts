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
        const date = createdAt.getDate();
        const month = createdAt.getMonth();
        const year = createdAt.getFullYear();
        const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const nth = function (d: number): string {
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
        };
        return `${date}<sup>${nth(date)}</sup> of ${monthName[month]} ${year}`;
    }

}

