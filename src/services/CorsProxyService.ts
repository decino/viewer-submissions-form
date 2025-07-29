import { Constant, Service } from "@tsed/di";
import GlobalEnv from "../model/constants/GlobalEnv.js";

@Service()
export class CorsProxyService {
    @Constant(GlobalEnv.PROXY_BASE_URL)
    private readonly proxyBaseUrl: string;

    public async getHtml(url: string): Promise<string> {
        const response = await fetch(`${this.proxyBaseUrl}/?url=${url}`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error(`Unable to get response ${response.statusText}`);
        }
        return response.text();
    }
}
