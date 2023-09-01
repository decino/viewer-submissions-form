import {Controller, Inject} from "@tsed/di";
import {BaseRestController} from "../BaseRestController";
import {Get, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {QueryParams} from "@tsed/common";
import {CorsProxyService} from "../../../services/CorsProxyService";
import {BadRequest} from "@tsed/exceptions";

@Controller("/utils")
export class UtilsController extends BaseRestController {

    @Inject()
    private corsProxyService: CorsProxyService;

    @Get("/corsProxy")
    @Returns(StatusCodes.OK, String)
    public corsProxy(@QueryParams("url") url: string): Promise<unknown> {
        try {
            return this.corsProxyService.getHtml(url);
        } catch (e) {
            throw new BadRequest(e.message);
        }
    }
}
