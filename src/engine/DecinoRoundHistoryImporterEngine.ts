import {Injectable, ProviderScope} from "@tsed/di";
import {JSDOM} from "jsdom";

type Entry = {
    no: number
    wad: string,
    level: string,
    chosen: boolean,
    youTubeLink?: string,
    submitter?: string,
    status?: string,
    wadDownload?: string
}


type SubmissionRound = {
    submissions: Entry[],
    roundId: number
}

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class DecinoRoundHistoryImporterEngine {
    private readonly baseUrl = "https://www.decino.nl/";

    public async getSubmissionRounds(): Promise<SubmissionRound[]> {
        const doc = await this.getDom(`${this.baseUrl}viewer-submissions`);
        const tables = doc.getElementsByTagName("table");
        const tableArr = Array.from(tables);
        const pArr = tableArr.map(table => this.getSubmissions(table, doc));
        return Promise.all(pArr).then(results => results.flat());
    }

    private async getDom(url: string): Promise<Document> {
        const jsDom = await JSDOM.fromURL(url, {
            runScripts: 'dangerously',
            resources: 'usable'
        });
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(jsDom.window.document);
            }, 2000);
        });
    }

    private async getSubmissions(table: HTMLTableElement, doc: Document): Promise<SubmissionRound> {
        const roundId = table.id;
        const allSubmissionsLinks: NodeListOf<HTMLAnchorElement> = doc.querySelectorAll("#siteContainer > a");
        const nodeArr = Array.from(allSubmissionsLinks);
        const mappedAllEntriesLink = nodeArr.find(link =>
            Number.parseInt(link.href.split("").pop()!) === Number.parseInt(roundId.replace(/^\D+/g, ''))
        );
        if (mappedAllEntriesLink) {
            const allSubmissionsDom = await this.getDom(mappedAllEntriesLink.href);
            const allEntriesTable = allSubmissionsDom.querySelector("table")!;
            const chosenEntries = this.parseTable(table);
            const allEntries = this.parseTable(allEntriesTable);
            // if the submission round has a record of all entries, map those
            return this.mapEntries(chosenEntries, allEntries, table, roundId);
        }
        return this.mapEntries(this.parseTable(table), [], table, roundId);
    }

    private parseTable(table: HTMLTableElement): Entry[] {
        const rows = Array.from(table.querySelectorAll("tr:not(#tableHeader)"));
        return rows.map(row => {
            const cells = Array.from(row.querySelectorAll("td"));
            const number = cells[0].textContent!;
            const wad = cells[1].textContent!;
            const level = cells[2].textContent!;
            return {
                wad,
                level,
                no: Number.parseInt(number!),
                chosen: false
            };
        });
    }

    private mapEntries(chosenEntries: Entry[], submittedEntries: Entry[], table: HTMLTableElement, roundId: string): SubmissionRound {
        if (submittedEntries.length === 0) {
            return this.getFullInfo(table, chosenEntries, roundId);
        }
        return this.getFullInfo(table, submittedEntries, roundId);
    }

    private getFullInfo(table: HTMLTableElement, submissions: Entry[], roundId: string): SubmissionRound {
        const rows = Array.from(table.querySelectorAll("tr:not(#tableHeader)"));

        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll("td"));
            const wad = cells[1].textContent!;
            const level = cells[2].textContent!;
            const baseInfo = submissions.find(sub => {
                const escapedSubWadName = sub.wad.replace(/[^a-zA-Z ]/g, "").toLowerCase();
                const parsedWadEscaped = wad.replace(/[^a-zA-Z ]/g, "").toLowerCase();
                let parsedWadLevel: string | number;
                let subWadLevel: number | string = Number.parseInt(sub.level);
                if (Number.isNaN(subWadLevel)) {
                    subWadLevel = sub.level;
                    parsedWadLevel = level;
                } else {
                    parsedWadLevel = Number.parseInt(level);
                }
                return escapedSubWadName === parsedWadEscaped && parsedWadLevel === subWadLevel;
            }) ?? null;
            if (baseInfo === null) {
                continue;
            }
            const number = cells[0].textContent!;
            const wadAnchor = cells[1].querySelector("a")!;
            const wadDownload = wadAnchor.href;
            const submitter = cells[3].textContent!;
            const statusAnchor = cells[4].querySelector("a")!;
            const status = statusAnchor.textContent!;
            const youTubeLink = statusAnchor.href;
            baseInfo.no = Number.parseInt(number);
            baseInfo.chosen = true;
            baseInfo.wadDownload = wadDownload;
            baseInfo.submitter = submitter;
            baseInfo.status = status;
            baseInfo.youTubeLink = youTubeLink;
        }

        return {
            submissions: submissions,
            roundId: Number.parseInt(roundId.replace(/^\D+/g, ''))
        };
    }
}
