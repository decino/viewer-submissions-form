import {SubmissionModel} from "../model/db/Submission.model";
import {Exception} from "@tsed/exceptions";

export type SubmissionModification = Partial<SubmissionModel>;

export type ReCAPTCHAResponse = {
    "success": boolean,
    "challenge_ts": string,
    "hostname": string,
    "error-codes": string[]
};


export type HttpErrorRenderObj = {
    status: number,
    message: string,
    internalError: Exception
}
