import {Controller, Inject} from "@tsed/di";
import {BaseRestController} from "../BaseRestController";
import {Get, Post, Returns, Security} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {QueryParams} from "@tsed/common";
import {CorsProxyService} from "../../../services/CorsProxyService";
import {BadRequest} from "@tsed/exceptions";
import {BodyParams} from "@tsed/platform-params";
import {WadValidationModel} from "../../../model/rest/wadValidationModel";
import {Authorize} from "@tsed/passport";
import {WadValidationService} from "../../../services/WadValidationService";

@Controller("/utils")
export class UtilsController extends BaseRestController {

    @Inject()
    private corsProxyService: CorsProxyService;

    @Inject()
    private wadValidationService: WadValidationService;

    @Get("/corsProxy")
    @Returns(StatusCodes.OK, String)
    public async corsProxy(@QueryParams("url") url: string): Promise<unknown> {
        try {
            return await this.corsProxyService.getHtml(url);
        } catch (e) {
            throw new BadRequest(e.message);
        }
    }

    @Get("/wadValidation")
    @Authorize(["login"])
    @Security("login")
    @Returns(StatusCodes.OK, WadValidationModel)
    public async getWadValidation(): Promise<WadValidationModel> {
        try {
            return await this.wadValidationService.getValidationMappings();
        } catch (e) {
            throw new BadRequest(e.message);
        }
    }

    @Post("/wadValidation")
    @Authorize("login")
    @Security("login")
    @Returns(StatusCodes.OK)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest).Description("If the payload fails validation")
    public async postWadValidation(@BodyParams() payload: WadValidationModel): Promise<void> {
        try {
            await this.wadValidationService.setValidation(payload);
        } catch (e) {
            throw new BadRequest(e);
        }
    }
}
