import {Get, View} from "@tsed/schema";
import {Controller, Inject} from "@tsed/di";
import {SubmissionRoundService} from "../../services/SubmissionRoundService";
import {ObjectUtils} from "../../utils/Utils";
import DOOM_ENGINE from "../../model/constants/DoomEngine";
import GZDOOM_ACTIONS from "../../model/constants/GZDoomActions";

@Controller("/")
export class HomeView {

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Get()
    @View("index.ejs")
    public async showRoot(): Promise<unknown> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        const allRounds = await this.submissionRoundService.getAllSubmissionRounds(false);
        return {
            currentActiveRound,
            allRounds,
            doomEngines: ObjectUtils.getEnumAsObject(DOOM_ENGINE),
            GzActions: ObjectUtils.getEnumAsObject(GZDOOM_ACTIONS)
        };
    }

}
