import {IHttpErrorRenderEngine} from "../../IHttpErrorRenderEngine";
import {Exception} from "@tsed/exceptions";
import {ResponseErrorObject} from "@tsed/common";
import {HttpErrorRenderObj} from "../../../utils/typeings";
import {Injectable, ProviderScope} from "@tsed/di";
import {HTTP_INJECTION_ENGINE} from "../../../model/di/tokens";

export type DefaultRenderObj = {
    name: string;
    message: string;
    errors: Exception;
    status: number
}

@Injectable({
    scope: ProviderScope.SINGLETON,
    type: HTTP_INJECTION_ENGINE
})
export class DefaultHttpRenderEngine implements IHttpErrorRenderEngine<DefaultRenderObj> {
    public render(obj: HttpErrorRenderObj): Promise<DefaultRenderObj> {
        return Promise.resolve(this.mapError(obj.internalError));
    }

    public supportsError(): boolean {
        return false;
    }


    public mapError(error: Exception): DefaultRenderObj {
        return {
            name: error.origin?.name || error.name,
            message: error.message,
            status: error.status || 500,
            errors: this.getErrors(error)
        };
    }

    public getTitle(): string | null {
        return null;
    }

    private getErrors(error: Exception): Exception {
        return [error, error.origin].filter(Boolean).reduce((errs, {errors}: ResponseErrorObject) => {
            return [...errs, ...(errors ?? [])];
        }, []);
    }

}
