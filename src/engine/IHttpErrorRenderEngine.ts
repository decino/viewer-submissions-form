import {HttpErrorRenderObj} from "../utils/typeings";
import {Exception} from "@tsed/exceptions";
import {PlatformResponse} from "@tsed/common";

export interface IHttpErrorRenderEngine<T> {
    render(obj: HttpErrorRenderObj, response: PlatformResponse): Promise<T>;

    supportsError(exception: Exception): boolean;
}
