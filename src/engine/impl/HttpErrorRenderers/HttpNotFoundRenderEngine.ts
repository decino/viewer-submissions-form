import {Injectable, ProviderScope} from "@tsed/di";
import {Exception, NotFound} from "@tsed/exceptions";
import {HTTP_INJECTION_ENGINE} from "../../../model/di/tokens";
import {ResourceNotFound} from "@tsed/platform-exceptions";
import {AbstractEjsHttpRenderEngine} from "./AbstractEjsHttpRenderEngine";

@Injectable({
    scope: ProviderScope.SINGLETON,
    type: HTTP_INJECTION_ENGINE
})
export class HttpNotFoundRenderEngine extends AbstractEjsHttpRenderEngine {

    public supportsError(exception: Exception): boolean {
        return exception instanceof ResourceNotFound || exception instanceof NotFound;
    }

    public getTitle(): string {
        return "The page you’re looking for doesn't exist.";
    }

}
