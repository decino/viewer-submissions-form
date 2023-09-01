import {Service} from "@tsed/di";
import fetch from 'node-fetch';

@Service()
export class CorsProxyService {
    public async getHtml(url: string): Promise<string> {
        const response = await fetch(url, {
            method: "POST"
        });
        if (!response.ok) {
            throw new Error(`Unable to get response ${response.statusText}`);
        }
        return response.text();
    }
}
