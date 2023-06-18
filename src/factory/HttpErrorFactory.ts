import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {Exception} from "@tsed/exceptions";
import {IHttpErrorRenderEngine} from "../engine/IHttpErrorRenderEngine";
import {HTTP_INJECTION_ENGINE} from "../model/di/tokens";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class HttpErrorFactory {

    public constructor(@Inject(HTTP_INJECTION_ENGINE) private readonly engines: IHttpErrorRenderEngine[]) {
    }

    public getRenderEngine(exception: Exception): IHttpErrorRenderEngine | null {
        return this.engines.find(engine => engine.supportsError(exception)) ?? null;
    }

}
