import {Injectable, ProviderScope} from "@tsed/di";
import {IHttpErrorRenderEngine} from "../../IHttpErrorRenderEngine";
import {HttpErrorRenderObj} from "../../../utils/typeings";
import {Exception, NotFound} from "@tsed/exceptions";
import {HTTP_INJECTION_ENGINE} from "../../../model/di/tokens";
import {ResourceNotFound} from "@tsed/platform-exceptions";
import {PlatformResponse} from "@tsed/common";

@Injectable({
    scope: ProviderScope.SINGLETON,
    type: HTTP_INJECTION_ENGINE
})
export class HttpNotFoundRenderEngine implements IHttpErrorRenderEngine {
    public render(obj: HttpErrorRenderObj, response: PlatformResponse): Promise<string> {
        return response.render("404.ejs", obj);
    }

    public supportsError(exception: Exception): boolean {
        return exception instanceof ResourceNotFound || exception instanceof NotFound;
    }

}
