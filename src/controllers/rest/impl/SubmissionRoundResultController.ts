import {Controller, Inject} from "@tsed/di";
import {BaseRestController} from "../BaseRestController";
import {Get, Integer, Post, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {PlatformResponse, QueryParams, Res} from "@tsed/common";
import {SubmissionModel} from "../../../model/db/Submission.model";
import {SubmissionRoundResultService} from "../../../services/SubmissionRoundResultService";
import {BodyParams} from "@tsed/platform-params";
import {SuccessModel} from "../../../model/rest/SuccessModel";
import {Authorize} from "@tsed/passport";

@Controller("/submissionRoundResult")
export class SubmissionRoundResultController extends BaseRestController {

    @Inject()
    private submissionRoundResultService: SubmissionRoundResultService;

    @Get("/generateEntries")
    @Authorize("login")
    @Returns(StatusCodes.OK, Array).Of(SubmissionModel)
    public generateEntries(@Res() res: PlatformResponse, @QueryParams("count") count?: number): unknown {
        return this.submissionRoundResultService.generateEntries(count);
    }

    @Post("/submitEntries")
    @Authorize("login")
    @Returns(StatusCodes.OK, SuccessModel)
    public async submitEntries(@Res() res: PlatformResponse, @BodyParams() @Integer() entries: number[]): Promise<unknown> {
        await this.submissionRoundResultService.submitEntries(entries);
        return super.doSuccess(res, "Entries have been saved.");
    }
}
