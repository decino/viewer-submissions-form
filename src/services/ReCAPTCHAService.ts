import {Inject, Service} from "@tsed/di";
import process from "process";
import {ReCAPTCHAResponse} from "../utils/typeings";
import fetch from "node-fetch";
import FormData from "form-data";
import {Logger} from "@tsed/common";

@Service()
export class ReCAPTCHAService {

    @Inject()
    private logger: Logger;

    private readonly baseUrl = "https://www.google.com/recaptcha/api/siteverify";

    public async validateResponse(clientResponse: string): Promise<boolean> {
        const form = new FormData();
        form.append('secret', process.env.RECAPTCHA_SECRET_KEY);
        form.append('response', clientResponse);
        const response = await fetch(this.baseUrl, {
            method: "POST",
            body: form
        });
        const responseJson = await response.json() as ReCAPTCHAResponse;
        const respBool = responseJson.success;
        if (!respBool) {
            this.logger.error(responseJson["error-codes"]);
        }
        return respBool;
    }
}
