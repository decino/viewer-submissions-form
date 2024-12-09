import { Constant, Inject, OnInit, Service } from "@tsed/di";
import { SubmissionModel } from "../model/db/Submission.model.js";
import { Logger } from "@tsed/common";
import GlobalEnv from "../model/constants/GlobalEnv.js";

type SubmissionPayload = {
    wadName: string;
    wadLevel: string;
    submissionRound: string;
    timeStamp: number;
    info: string | null;
};

type PendingValidationPayload = {
    wadName: string;
    email: string;
    submitterName: string | null;
    info: string | null;
    id: number;
    map: string;
};

@Service()
export class DiscordBotDispatcherService implements OnInit {
    @Constant(GlobalEnv.BOT_URI)
    private readonly botUri: string;

    private dispatchAddress: string | null = null;

    @Inject()
    private logger: Logger;

    public $onInit(): void {
        if (this.dispatchAddress) {
            this.dispatchAddress = `${this.botUri}/bot`;
        }
    }

    public async sendPendingSubmission(submission: SubmissionModel): Promise<void> {
        const payload: PendingValidationPayload = {
            wadName: submission.wadName,
            email: submission.submitterEmail,
            submitterName: submission.submitterName,
            info: submission.info,
            id: submission.id,
            map: submission.wadLevel,
        };

        try {
            await this.doPost("postPendingValidationRequest", payload);
        } catch (e) {
            this.logger.warn(`Unable to send entry to bot.`, e.message);
        }
    }

    public async sendNewSubmission(entry: SubmissionModel): Promise<void> {
        const submissionRound = await entry.submissionRound;
        const payload: SubmissionPayload = {
            wadName: entry.wadName,
            info: entry.info,
            wadLevel: entry.wadLevel,
            timeStamp: entry.createdAt.getTime(),
            submissionRound: submissionRound.name,
        };

        try {
            await this.doPost("postSubmission", payload);
        } catch (e) {
            this.logger.warn(`Unable to send entry to bot.`, e.message);
        }
    }

    private async doPost(endpoint: string, payload: unknown): Promise<Record<string, unknown> | null> {
        if (!this.dispatchAddress) {
            return null;
        }
        let response: Response;
        try {
            response = await fetch(`${this.dispatchAddress}/${endpoint}`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            this.logger.warn(`Unable to send entry to bot.`, e);
            throw e;
        }
        const json = await response.json();
        if (!response.ok) {
            throw new Error(`Bot response error :${json.error}\ninfo:${json.message}`);
        }
        return json;
    }
}
