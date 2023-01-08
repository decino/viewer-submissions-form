import {Inject, Service} from "@tsed/di";
import {SubmissionModel} from "../model/db/Submission.model";
import fetch from 'node-fetch';
import {Logger} from "@tsed/common";

type SubmissionPayload = {
    wadName: string,
    wadLevel: string,
    info: string | null
}

@Service()
export class DiscordBotDispatcherService {

    private readonly dispatchAddress = `${process.env.BOT_URI}/bot/postSubmission`;

    @Inject()
    private logger: Logger;

    public dispatch(entry: SubmissionModel): Promise<void> {
        const payload: SubmissionPayload = {
            wadName: entry.wadName,
            info: entry.info,
            wadLevel: entry.wadLevel
        };
        return fetch(this.dispatchAddress, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(e => {
            this.logger.warn(`Unable to send entry to bot.`, e);
        }) as Promise<void>;
    }
}
