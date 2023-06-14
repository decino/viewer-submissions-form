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
        return this.submissionRoundResultService.generateEntries(count ?? -1);
    }

    @Post("/buildResultSet")
    @Authorize("login")
    @Returns(StatusCodes.OK, SuccessModel)
    public async buildResultSet(@Res() res: PlatformResponse): Promise<unknown> {
        await this.submissionRoundResultService.buildResultSet();
        return super.doSuccess(res, "Entry cache generated.");
    }

    @Post("/submitEntries")
    @Authorize("login")
    @Returns(StatusCodes.OK, SuccessModel)
    public async submitEntries(@Res() res: PlatformResponse, @BodyParams() @Integer() entries: number[]): Promise<unknown> {
        await this.submissionRoundResultService.submitEntries(entries);
        return super.doSuccess(res, "Entries have been saved.");
    }

    @Post("/addRandomEntry")
    @Authorize("login")
    @Returns(StatusCodes.OK)
    public async addRandomEntry(@Res() res: PlatformResponse, @QueryParams("roundId") roundId: number): Promise<unknown> {
        const entryAdded = await this.submissionRoundResultService.addRandomEntry(roundId);
        return super.doSuccess(res, `${entryAdded.wadName} map ${entryAdded.wadLevel} has been chosen.`);
    }
}
