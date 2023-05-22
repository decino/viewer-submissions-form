import {Controller, Inject} from "@tsed/di";
import {Get, View} from "@tsed/schema";
import {IndexDto} from "../../DTO/IndexDto";
import {SubmissionRoundService} from "../../services/SubmissionRoundService";
import {SubmissionRoundResultService} from "../../services/SubmissionRoundResultService";
import {Hidden} from "@tsed/swagger";
import {Authorize} from "@tsed/passport";
import {Req} from "@tsed/common";
import {CustomUserInfoModel} from "../../model/auth/CustomUserInfoModel";

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
    public async showAdmin(@Req() req: Req): Promise<unknown> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        const previousRounds = await this.submissionRoundResultService.getAllSubmissionRoundResults();
        const user = req.user as CustomUserInfoModel;
        return {
            indexModel: new IndexDto(currentActiveRound, previousRounds),
            user
        };
    }

}
