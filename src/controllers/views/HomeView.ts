import {Get, View} from "@tsed/schema";
import {Controller, Inject} from "@tsed/di";
import {SubmissionRoundService} from "../../services/SubmissionRoundService";
import {SubmissionConfirmationService} from "../../services/SubmissionConfirmationService";
import {PlatformResponse, QueryParams, Req, Res} from "@tsed/common";
import {NotFound} from "@tsed/exceptions";
import {SubmissionRoundResultService} from "../../services/SubmissionRoundResultService";
import {IndexDto} from "../../DTO/IndexDto";
import {Hidden} from "@tsed/swagger";

@Controller("/")
@Hidden()
export class HomeView {

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private submissionRoundResultService: SubmissionRoundResultService;

    @Inject()
    private submissionConfirmationService: SubmissionConfirmationService;

    @Get()
    @View("index.ejs")
    public async showRoot(): Promise<unknown> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        const previousRounds = await this.submissionRoundResultService.getAllSubmissionRoundResults();
        return {
            model: new IndexDto(currentActiveRound, previousRounds)
        };
    }

    @Get("/tos")
    @View("tos.ejs")
    public showTos(): unknown {
        return null;
    }


    @Get("/login")
    @View("login.ejs")
    public showLogin(@Req() req: Req, @Res() res: Res): unknown {
        if (req.user) {
            res.redirect("/secure");
        }
        return null;
    }

    @Get("/processSubmission")
    @View("submissionSuccessful.ejs")
    public async createRound(@Res() res: PlatformResponse, @QueryParams("uid") uid: string): Promise<unknown> {
        const retStre = {
            message: "Your submission has been submitted and is awaiting manual verification. It will show as soon as it is verified.",
            success: true
        };
        try {
            if (!uid) {
                throw new NotFound("No UID supplied.");
            }
            await this.submissionConfirmationService.processConfirmation(uid);
        } catch (e) {
            retStre.message = e.message;
            retStre.success = false;
        }
        return retStre;
    }

}
