import {Controller, Inject} from "@tsed/di";
import {Get, Post, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {PlatformResponse, QueryParams, Res} from "@tsed/common";
import {SubmissionRoundModel} from "../../../model/db/SubmissionRound.model";
import {SubmissionRoundService} from "../../../services/SubmissionRoundService";
import {BaseRestController} from "../BaseRestController";
import {SuccessModel} from "../../../model/rest/SuccessModel";
import {BadRequest, NotFound} from "@tsed/exceptions";

@Controller("/submissionRound")
export class SubmissionRoundController extends BaseRestController {

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Post("/newRound")
    @Returns(StatusCodes.CREATED, SubmissionRoundModel)
    public createRound(): unknown {
        return this.submissionRoundService.newSubmissionRound();
    }

    @Get("/currentActiveRound")
    @Returns(StatusCodes.OK, SubmissionRoundModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    public async getActiveRound(): Promise<unknown> {
        const activeRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        if (!activeRound) {
            throw new NotFound("No submission rounds are currently active");
        }
        return activeRound;
    }

    @Get("/getAllRounds")
    @Returns(StatusCodes.OK, Array).Of(SubmissionRoundModel)
    public getAllRounds(@Res() res: PlatformResponse, @QueryParams("includeActive") includeActive: boolean): unknown {
        return this.submissionRoundService.getAllSubmissionRounds(includeActive);
    }

    @Post("/endCurrentRound")
    @Returns(StatusCodes.OK, SuccessModel)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public async endCurrentRound(@Res() res: PlatformResponse): Promise<unknown> {
        const ended = await this.submissionRoundService.endActiveSubmissionRound();
        if (ended) {
            return super.doSuccess(res, "the currently active submission round has been ended");
        }
        throw new BadRequest("There are no currently active submission rounds to end");
    }
}
