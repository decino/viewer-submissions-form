import {Controller, Inject} from "@tsed/di";
import {Delete, Get, Post, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {SubmissionModel} from "../../model/db/Submission.model";
import {SubmissionService} from "../../services/SubmissionService";
import {BodyParams, PathParams} from "@tsed/platform-params";
import {BadRequest, InternalServerError, NotFound} from "@tsed/exceptions";
import {SuccessModel} from "../../model/rest/SuccessModel";
import {MultipartFile, PlatformMulterFile, PlatformResponse, QueryParams, Res} from "@tsed/common";
import {BaseRestController} from "./BaseRestController";
import {CustomWadEngine} from "../../engine/CustomWadEngine";

@Controller("/submission")
export class SubmissionController extends BaseRestController {

    @Inject()
    private submissionService: SubmissionService;

    @Inject()
    private customWadEngine: CustomWadEngine;

    @Post("/addEntry")
    @Returns(StatusCodes.CREATED, SubmissionModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public addEntry(@BodyParams() submission: SubmissionModel, @MultipartFile("file") customWad: PlatformMulterFile): unknown {
        return this.submissionService.addEntry(submission, customWad ?? null);
    }

    @Get("/downloadWad/:roundId/:id")
    @Returns(StatusCodes.CREATED, Buffer)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public async downloadWad(@Res() res: PlatformResponse, @PathParams("id") id: number, @PathParams("roundId") roundId: number): Promise<unknown> {
        const wad = await this.customWadEngine.getWad(roundId, id);
        if (!wad) {
            throw new NotFound(`Unable to find wad with id: ${id}`);
        }
        const entry = await this.submissionService.getEntry(id);
        if (!entry) {
            throw new InternalServerError("An error has occurred when trying to find this wads associated entry");
        }
        if (!entry.distributable) {
            throw new BadRequest("This wad is not sharable by authors request");
        }
        res.attachment(entry.customWadFileName);
        res.contentType("application/octet-stream");
        return wad.content;
    }

    @Delete("/deleteEntry")
    @Returns(StatusCodes.CREATED, SuccessModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    public async deleteEntry(@Res() res: PlatformResponse, @QueryParams("id") submissionId: number): Promise<unknown> {
        const result = await this.submissionService.deleteEntry(submissionId);
        if (!result) {
            throw new NotFound(`Entry with id ${submissionId} not found`);
        }
        return super.doSuccess(res, `entry ${submissionId} has been deleted`);
    }
}
