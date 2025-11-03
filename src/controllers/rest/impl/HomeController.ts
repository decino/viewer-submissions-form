import { Controller, Inject } from "@tsed/di";
import { Get, Hidden, Returns } from "@tsed/schema";
import { StatusCodes } from "http-status-codes";
import { BaseRestController } from "../BaseRestController.js";
import { SubmissionRoundService } from "../../../services/SubmissionRoundService.js";
import { SubmissionRoundResultService } from "../../../services/SubmissionRoundResultService.js";
import { WadValidationService } from "../../../services/WadValidationService.js";
import { IndexDto } from "../../../DTO/ejs/IndexDto.js";

@Controller("/home")
@Hidden()
export class HomeController extends BaseRestController {
    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private submissionRoundResultService: SubmissionRoundResultService;

    @Inject()
    private wadValidationService: WadValidationService;

    @Get("/data")
    @Returns(StatusCodes.OK, IndexDto)
    public async getHomeData(): Promise<IndexDto> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        const previousRounds = await this.submissionRoundResultService.getAllSubmissionRoundResults();
        return new IndexDto(currentActiveRound, previousRounds, this.wadValidationService);
    }
}
