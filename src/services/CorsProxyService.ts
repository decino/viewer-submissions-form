import { Service } from "@tsed/di";

@Service()
export class CorsProxyService {
    public async getHtml(url: string): Promise<string> {
        const response = await fetch(url, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error(`Unable to get response ${response.statusText}`);
        }
        return response.text();
    }
}
