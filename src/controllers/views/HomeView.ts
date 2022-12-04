import {Get, View} from "@tsed/schema";
import {Controller, Inject} from "@tsed/di";
import {SubmissionRoundService} from "../../services/SubmissionRoundService";

@Controller("/")
export class HomeView {

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Get()
    @View("index.ejs")
    public async get(): Promise<unknown> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        const allRounds = await this.submissionRoundService.getAllSubmissionRounds(false);
        return {
            currentActiveRound,
            allRounds
        };
    }
}
