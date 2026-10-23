import { Controller, Inject } from "@tsed/di";
import { Get, Returns } from "@tsed/schema";
import { StatusCodes } from "http-status-codes";
import { BaseRestController } from "../BaseRestController.js";
import { SubmissionRoundService } from "../../../services/SubmissionRoundService.js";
import { SubmissionRoundResultService } from "../../../services/SubmissionRoundResultService.js";
import { SubmissionRoundModel } from "../../../model/db/SubmissionRound.model.js";

@Controller("/round")
export class RoundController extends BaseRestController {
    public constructor(
        @Inject() private readonly submissionRoundService: SubmissionRoundService,
        @Inject() private readonly submissionRoundResultService: SubmissionRoundResultService,
    ) {
        super();
    }

    @Get("/current")
    @(Returns(StatusCodes.OK, SubmissionRoundModel).Groups("public"))
    public getCurrentRound(): Promise<SubmissionRoundModel | null> {
        return this.submissionRoundService.getCurrentActiveSubmissionRound();
    }

    @Get("/previous")
    @(Returns(StatusCodes.OK, Array).Of(SubmissionRoundModel).Groups("public"))
    public getPreviousRounds(): Promise<SubmissionRoundModel[]> {
        return this.submissionRoundResultService.getAllSubmissionRoundResults();
    }
}
