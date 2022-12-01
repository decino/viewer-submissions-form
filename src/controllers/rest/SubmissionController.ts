import {Controller, Inject} from "@tsed/di";
import {Delete, Post, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {SubmissionModel} from "../../model/db/Submission.model";
import {SubmissionService} from "../../services/SubmissionService";
import {BodyParams} from "@tsed/platform-params";
import {NotFound} from "@tsed/exceptions";
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
    public addEntry(@BodyParams() submission: SubmissionModel, @MultipartFile("file") customWad: PlatformMulterFile): unknown {
        return this.submissionService.addEntry(submission, customWad ?? null);
    }

    @Delete("/deleteEntry")
    @Returns(StatusCodes.CREATED, SuccessModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    public async deleteEntry(@Res() res: PlatformResponse, @QueryParams("id") submissionId: number): Promise<unknown> {
        const result = await this.submissionService.deleteEntry(submissionId);
        if (result.affected == 0) {
            throw new NotFound(`Entry with id ${submissionId} not found`);
        }
        return super.doSuccess(res, `entry ${submissionId} has been deleted`);
    }
}
