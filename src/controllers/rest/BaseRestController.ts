import {PlatformResponse} from "@tsed/common";
import {getReasonPhrase, StatusCodes} from "http-status-codes";

export abstract class BaseRestController {
    protected doError(res: PlatformResponse, message: string, status: StatusCodes): PlatformResponse {
        return res.status(status).body({
            error: `${status} ${getReasonPhrase(status)}`,
            message: message
        });
    }
}
