import { Get, View } from "@tsed/schema";
import { Controller, Inject } from "@tsed/di";
import { SubmissionRoundService } from "../../services/SubmissionRoundService.js";
import { SubmissionConfirmationService } from "../../services/SubmissionConfirmationService.js";
import { QueryParams, Req, Res } from "@tsed/common";
import { NotFound } from "@tsed/exceptions";
import { SubmissionRoundResultService } from "../../services/SubmissionRoundResultService.js";
import { IndexDto } from "../../DTO/ejs/IndexDto.js";
import type { UUID } from "crypto";
import { WadValidationService } from "../../services/WadValidationService.js";
import { CaptchaManager } from "../../manager/CaptchaManager.js";
import CaptchaServices from "../../model/constants/CaptchaServices.js";

@Controller("/")
export class HomeView {
    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private submissionRoundResultService: SubmissionRoundResultService;

    @Inject()
    private submissionConfirmationService: SubmissionConfirmationService;

    @Inject()
    private wadValidationService: WadValidationService;

    @Inject()
    private captchaManager: CaptchaManager;

    private get activeCaptchaService(): CaptchaServices | null {
        return this.captchaManager.engine?.type ?? null;
    }

    @Get()
    @View("index.ejs")
    public async showRoot(): Promise<unknown> {
        const captchaType = this.activeCaptchaService;
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        const previousRounds = await this.submissionRoundResultService.getAllSubmissionRoundResults();
        return {
            model: new IndexDto(currentActiveRound, previousRounds, this.wadValidationService),
            captchaType,
        };
    }

    @Get("/login")
    @View("login.ejs")
    public showLogin(@Req() req: Req, @Res() res: Res): unknown {
        if (req.user) {
            res.redirect("/secure");
        }
        const captchaType = this.activeCaptchaService;
        return {
            captchaType,
        };
    }

    @Get("/processSubmission")
    @View("submissionSuccessful.ejs")
    public async processSubmission(@QueryParams("uid") uid: string): Promise<unknown> {
        const retStre = {
            message:
                "Your submission has been submitted and is awaiting manual verification. It will show as soon as it is verified.",
            success: true,
        };
        try {
            if (!uid) {
                throw new NotFound("No UID supplied.");
            }
            await this.submissionConfirmationService.processConfirmation(uid as UUID);
        } catch (e) {
            retStre.message = e.message;
            retStre.success = false;
        }
        return retStre;
    }
}
