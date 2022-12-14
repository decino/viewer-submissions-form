import {Controller, Inject} from "@tsed/di";
import {Get, View} from "@tsed/schema";
import {IndexDto} from "../../DTO/IndexDto";
import {SubmissionRoundService} from "../../services/SubmissionRoundService";
import {SubmissionRoundResultService} from "../../services/SubmissionRoundResultService";
import {Hidden} from "@tsed/swagger";
import {Authorize} from "@tsed/passport";

@Controller("/")
@Hidden()
export class AdminHome {

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private submissionRoundResultService: SubmissionRoundResultService;

    @Get()
    @Authorize("login")
    @View("/secure/admin.ejs")
    public async showAdmin(): Promise<unknown> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        const previousRounds = await this.submissionRoundResultService.getAllSubmissionRoundResults();
        return {
            indexModel: new IndexDto(currentActiveRound, previousRounds)
        };
    }

}
