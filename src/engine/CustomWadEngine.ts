import {Injectable, ProviderScope} from "@tsed/di";
import * as fs from "fs";
import {PlatformMulterFile} from "@tsed/common";

export type CustomWadEntry = {
    content: Buffer,
    filename: string
}

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class CustomWadEngine {
    protected readonly basePath = `${__dirname}/../../customWads`;

    public async getWad(entryId: number): Promise<CustomWadEntry | null> {
        const files = await fs.promises.readdir(`${this.basePath}/${entryId}`);
        const content = await fs.promises.readFile(`${this.basePath}/${entryId}/${files[0]}`);
        return {
            content,
            filename: files[0]
        };
    }

    public async moveWad(entryId: number, customWad: PlatformMulterFile): Promise<void> {
        const newFolder = `${this.basePath}/${entryId}`;
        await fs.promises.mkdir(newFolder, {recursive: true});
        return fs.promises.rename(customWad.path, `${newFolder}/${customWad.originalname}`);
    }
}
