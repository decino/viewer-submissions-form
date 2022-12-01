import {Controller, Inject} from "@tsed/di";
import {Post, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {PlatformResponse, Res} from "@tsed/common";
import {SubmissionRoundModel} from "../../model/db/SubmissionRound.model";
import {SubmissionRoundService} from "../../services/SubmissionRoundService";
import {BaseRestController} from "./BaseRestController";

@Controller("/submissionRound")
export class SubmissionRoundController extends BaseRestController {

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Post("/newRound")
    @Returns(StatusCodes.CREATED, SubmissionRoundModel)
    public get(@Res() res: PlatformResponse): unknown {
        try {
            return this.submissionRoundService.newSubmissionRound();
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
