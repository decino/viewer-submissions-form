import {Controller, Inject} from "@tsed/di";
import {BaseRestController} from "../BaseRestController";
import {Get, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {PlatformResponse, QueryParams, Res} from "@tsed/common";
import {SubmissionModel} from "../../../model/db/Submission.model";
import {SubmissionRoundResultService} from "../../../services/SubmissionRoundResultService";

@Controller("/submissionRoundResult")
export class SubmissionRoundResultController extends BaseRestController {

    @Inject()
    private submissionRoundResultService: SubmissionRoundResultService;

    @Get("/generateEntries")
    @Returns(StatusCodes.OK, Array).Of(SubmissionModel)
    public generateEntries(@Res() res: PlatformResponse, @QueryParams("count") count?: number): unknown {
        return this.submissionRoundResultService.generateEntries(count);
    }
}
