import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import DOOM_ENGINE from "../model/constants/DoomEngine";
import GZDOOM_ACTIONS from "../model/constants/GZDoomActions";
import {ObjectUtils} from "../utils/Utils";
import {WadValidationService} from "../services/WadValidationService";

export class IndexDto {
    private readonly months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    private readonly _allowedUploadExtensions: string;

    public constructor(public currentActiveRound: SubmissionRoundModel | null,
                       public previousRounds: SubmissionRoundModel[],
                       public wadValidationService: WadValidationService) {
        this._allowedUploadExtensions = wadValidationService.allowedFiles.map(ext => `.${ext}`).join(",");
    }

    public get allowedUploadExtensions(): string {
        return this._allowedUploadExtensions;
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
        return `${date}<sup>${this.nth(date)}</sup> of ${this.months[month]} ${year} at ${time} UTC`;
    }

    public getEndDate(round: SubmissionRoundModel): string | null {
        const endDate = round.endDate;
        if (!endDate) {
            return null;
        }
        const date = endDate.getUTCDate();
        const month = endDate.getUTCMonth();
        const year = endDate.getUTCFullYear();
        return `${date}<sup>${this.nth(date)}</sup> of ${this.months[month]} ${year} UTC`;
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
}

