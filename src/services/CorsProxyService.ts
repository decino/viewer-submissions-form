import { Constant, Service } from "@tsed/di";
import GlobalEnv from "../model/constants/GlobalEnv.js";

@Service()
export class CorsProxyService {
    @Constant(GlobalEnv.PROXY_BASE_URL)
    private readonly proxyBaseUrl: string;

    public async getHtml(url: string): Promise<string> {
        const target = new URL(url);
        const isDoomworld = target.hostname === "doomworld.com" || target.hostname.endsWith(".doomworld.com");
        if (!isDoomworld || !target.pathname.includes("idgames")) {
            throw new Error("Only Doomworld idgames pages can be fetched");
        }

        const response = await fetch(`${this.proxyBaseUrl}/?url=${encodeURIComponent(target.toString())}`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error(`Unable to get response ${response.statusText}`);
        }
        return response.text();
    }
}
