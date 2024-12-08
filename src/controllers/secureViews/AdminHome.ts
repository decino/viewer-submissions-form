import { Controller, Inject } from "@tsed/di";
import { Get, Security, View } from "@tsed/schema";
import { SubmissionRoundService } from "../../services/SubmissionRoundService.js";
import { SubmissionRoundResultService } from "../../services/SubmissionRoundResultService.js";
import { Authorize } from "@tsed/passport";
import { Req } from "@tsed/common";
import { CustomUserInfoModel } from "../../model/auth/CustomUserInfoModel.js";
import { AdminDto } from "../../DTO/AdminDto.js";
import { WadValidationService } from "../../services/WadValidationService.js";

@Controller("/")
export class AdminHome {
    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private submissionRoundResultService: SubmissionRoundResultService;

    @Inject()
    private wadValidationService: WadValidationService;

    @Get()
    @Authorize("login")
    @Security("login")
    @View("/secure/admin.ejs")
    public async showAdmin(@Req() req: Req): Promise<unknown> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound(false);
        const previousRounds = await this.submissionRoundResultService.getAllSubmissionRoundResults();
        const user = req.user as CustomUserInfoModel;
        const mostSubmittedWad = await this.submissionRoundService.getMostSubmittedWadName();
        return {
            indexModel: new AdminDto(currentActiveRound, previousRounds, this.wadValidationService),
            user,
            mostSubmittedWad,
        };
    }
}
