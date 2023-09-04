import {Inject, Injectable, ProviderScope} from "@tsed/di";
import fs from "fs";
import {PlatformMulterFile} from "@tsed/common";
import {SettingsService} from "../services/SettingsService";

export type CustomWadEntry = {
    content: Buffer,
    filename: string
}

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class CustomWadEngine {
    private readonly basePath = `${__dirname}/../../customWads`;

    @Inject()
    private readonly settingsService: SettingsService;

    public async getWad(round: number, entryId: number): Promise<CustomWadEntry | null> {
        const files = await fs.promises.readdir(`${this.basePath}/${round}/${entryId}`);
        if (files.length === 0) {
            return null;
        }
        const content = await fs.promises.readFile(`${this.basePath}/${round}/${entryId}/${files[0]}`);
        return {
            content,
            filename: files[0]
        };
    }

    public async moveWad(entryId: number, customWad: PlatformMulterFile, round: number): Promise<void> {
        const newFolder = `${this.basePath}/${round}/${entryId}`;
        await fs.promises.mkdir(newFolder, {recursive: true});
        return fs.promises.rename(customWad.path, `${newFolder}/${customWad.originalname}`);
    }


    public deleteCustomWad(entry: number, round: number): Promise<void>;
    public deleteCustomWad(entry: PlatformMulterFile): Promise<void>;
    public deleteCustomWad(entry: number | PlatformMulterFile, round?: number): Promise<void> {
        const toDelete = typeof entry === "number" ? `${this.basePath}/${round}/${entry}` : entry.path;
        return fs.promises.rm(toDelete, {recursive: true, force: true});
    }


}
