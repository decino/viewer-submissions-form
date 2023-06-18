import {HttpErrorRenderObj} from "../utils/typeings";
import {Exception} from "@tsed/exceptions";
import {PlatformResponse} from "@tsed/common";

export interface IHttpErrorRenderEngine {
    render(obj: HttpErrorRenderObj, response: PlatformResponse): Promise<string>;

    supportsError(exception: Exception): boolean;
}
