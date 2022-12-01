import {Controller, Inject} from "@tsed/di";
import {Get, Post, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {PlatformResponse, QueryParams, Res} from "@tsed/common";
import {SubmissionRoundModel} from "../../model/db/SubmissionRound.model";
import {SubmissionRoundService} from "../../services/SubmissionRoundService";
import {BaseRestController} from "./BaseRestController";
import {ErrorModel} from "../../model/rest/ErrorModel";
import {SuccessModel} from "../../model/rest/SuccessModel";

@Controller("/submissionRound")
export class SubmissionRoundController extends BaseRestController {

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Post("/newRound")
    @Returns(StatusCodes.CREATED, SubmissionRoundModel)
    public createRound(@Res() res: PlatformResponse): unknown {
        try {
            return this.submissionRoundService.newSubmissionRound();
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    @Get("/currentActiveRound")
    @Returns(StatusCodes.OK, SubmissionRoundModel)
    @Returns(StatusCodes.NOT_FOUND, ErrorModel)
    public async getActiveRound(@Res() res: PlatformResponse): Promise<unknown> {
        try {
            const activeRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
            if (!activeRound) {
                return super.doError(res, "No submission rounds are currently active", StatusCodes.NOT_FOUND);
            }
            return activeRound;
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    @Get("/getAllRounds")
    @Returns(StatusCodes.OK, Array).Of(SubmissionRoundModel)
    @Returns(StatusCodes.NOT_FOUND, ErrorModel)
    public getAllRounds(@Res() res: PlatformResponse, @QueryParams("includeActive") includeActive: boolean): unknown {
        try {
            return this.submissionRoundService.getAllSubmissionRounds(includeActive);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    @Post("/endCurrentRound")
    @Returns(StatusCodes.OK, SuccessModel)
    @Returns(StatusCodes.BAD_REQUEST, ErrorModel)
    public async endCurrentRound(@Res() res: PlatformResponse): Promise<unknown> {
        try {
            const ended = await this.submissionRoundService.endActiveSubmissionRound();
            if (ended) {
                return super.doSuccess(res, "the currently active submission round has been ended");
            }
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }
        return super.doError(res, "There are no currently active submission rounds to end", StatusCodes.BAD_REQUEST);
    }
}
