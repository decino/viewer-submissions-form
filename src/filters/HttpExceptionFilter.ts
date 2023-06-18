import {Catch, ExceptionFilterMethods, PlatformContext, ResponseErrorObject} from "@tsed/common";
import {Exception} from "@tsed/exceptions";
import {Inject} from "@tsed/di";
import {HttpErrorFactory} from "../factory/HttpErrorFactory";
import {HttpErrorRenderObj} from "../utils/typeings";

@Catch(Exception)
export class HttpExceptionFilter implements ExceptionFilterMethods {

    @Inject()
    private httpErrorFactory: HttpErrorFactory;

    public async catch(exception: Exception, ctx: PlatformContext): Promise<void> {
        const renderEngine = this.httpErrorFactory.getRenderEngine(exception);
        if (!renderEngine) {
            return this.renderDefault(exception, ctx);
        }
        const obj: HttpErrorRenderObj = {
            status: exception.status,
            message: exception.message
        };
        const response = ctx.response;
        const html = await renderEngine.render(obj, response);
        response.status(exception.status).body(html);
    }

    public mapError(error: Exception): { name: string; message: string; errors: Exception; status: number } {
        return {
            name: error.origin?.name || error.name,
            message: error.message,
            status: error.status || 500,
            errors: this.getErrors(error)
        };
    }

    private renderDefault(exception: Exception, ctx: PlatformContext): void {
        const {response} = ctx;
        const error = this.mapError(exception);
        const headers = this.getHeaders(exception);
        response.setHeaders(headers).status(error.status).body(error);
    }

    private getErrors(error: Exception): Exception {
        return [error, error.origin].filter(Boolean).reduce((errs, {errors}: ResponseErrorObject) => {
            return [...errs, ...(errors ?? [])];
        }, []);
    }

    private getHeaders(error: Exception): Exception {
        return [error, error.origin].filter(Boolean).reduce((obj, {headers}: ResponseErrorObject) => {
            return {
                ...obj,
                ...(headers ?? {})
            };
        }, {});
    }

}
