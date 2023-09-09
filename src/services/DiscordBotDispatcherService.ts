import {Constant, Inject, OnInit, Service} from "@tsed/di";
import {SubmissionModel} from "../model/db/Submission.model";
import fetch, {Response} from 'node-fetch';
import {Logger} from "@tsed/common";
import GlobalEnv from "../model/constants/GlobalEnv";

type SubmissionPayload = {
    wadName: string,
    wadLevel: string,
    submissionRound: string,
    info: string | null,
}

@Service()
export class DiscordBotDispatcherService implements OnInit {

    @Constant(GlobalEnv.BOT_URI)
    private readonly botUri: string;

    private dispatchAddress: string;

    @Inject()
    private logger: Logger;

    public $onInit(): void {
        this.dispatchAddress = `${this.botUri}/bot/postSubmission`;
    }

    public async dispatch(entry: SubmissionModel): Promise<void> {
        const payload: SubmissionPayload = {
            wadName: entry.wadName,
            info: entry.info,
            wadLevel: entry.wadLevel,
            submissionRound: entry.submissionRound!.name
        };

        let response: Response;
        try {
            response = await fetch(this.dispatchAddress, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            this.logger.warn(`Unable to send entry to bot.`, e);
            return;
        }
        if (!response.ok) {
            const json = await response.json();
            this.logger.warn(`Bot response error :${json.error}\ninfo:${json.message}`);
            return;
        }
    }
}
