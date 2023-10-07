import {SubmissionModel} from "../model/db/Submission.model";
import {Exception} from "@tsed/exceptions";
import SETTING from "../model/constants/Settings";

export type SubmissionModification = Partial<SubmissionModel>;

export type ReCAPTCHAResponse = {
    "success": boolean,
    "challenge_ts": string,
    "hostname": string,
    "error-codes": string[]
};


export type HttpErrorRenderObj = {
    status: number,
    title: string | null,
    message: string,
    internalError: Exception
};

export type SettingsTuple = [SETTING, string][];
