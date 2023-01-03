import {Middleware, MiddlewareMethods} from "@tsed/platform-middlewares";
import {Inject} from "@tsed/di";
import {ReCAPTCHAService} from "../../services/ReCAPTCHAService";
import {BadRequest} from "@tsed/exceptions";
import {QueryParams} from "@tsed/common";

@Middleware()
export class ReCAPTCHAMiddleWare implements MiddlewareMethods {

    @Inject()
    private reCAPTCHAService: ReCAPTCHAService;

    public async use(@QueryParams("reCAPTCHA") reCAPTCHA: string): Promise<void> {
        if (!reCAPTCHA) {
            throw new BadRequest("reCAPTCHA missing");
        }
        const reCAPTCHAResp = await this.reCAPTCHAService.validateResponse(reCAPTCHA);
        if (!reCAPTCHAResp) {
            throw new BadRequest("reCAPTCHA response invalid");
        }
    }

}
