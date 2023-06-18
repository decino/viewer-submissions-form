import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {Exception} from "@tsed/exceptions";
import {IHttpErrorRenderEngine} from "../engine/IHttpErrorRenderEngine";
import {HTTP_INJECTION_ENGINE} from "../model/di/tokens";
import {DefaultHttpRenderEngine} from "../engine/impl/HttpErrorRenderers/DefaultHttpRenderEngine";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class HttpErrorFactory {

    public constructor(@Inject(HTTP_INJECTION_ENGINE) private readonly engines: IHttpErrorRenderEngine<unknown>[]) {
    }

    public getRenderEngine(exception: Exception): IHttpErrorRenderEngine<unknown> {
        const defaultRenderEngine = this.engines.find(engine => engine instanceof DefaultHttpRenderEngine)!;
        return this.engines.find(engine => engine.supportsError(exception)) ?? defaultRenderEngine;
    }

}
