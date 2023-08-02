import {Constant, Injectable, ProviderScope} from "@tsed/di";
import fs from "fs";
import {PlatformMulterFile} from "@tsed/common";
import GlobalEnv from "../model/constants/GlobalEnv";
import {BadRequest} from "@tsed/exceptions";

export type CustomWadEntry = {
    content: Buffer,
    filename: string
}

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class CustomWadEngine {
    private readonly basePath = `${__dirname}/../../customWads`;

    @Constant(GlobalEnv.ALLOWED_HEADERS)
    private readonly allowedHeaders: string;

    @Constant(GlobalEnv.ALLOWED_FILES)
    private readonly allowedFiles: string;

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

    public async validateFile(customWad: PlatformMulterFile): Promise<void> {
        this.checkFileExt(customWad);
        const allowedHeaders = this.allowedHeaders;
        if (!allowedHeaders) {
            return;
        }
        const buffer = await fs.promises.readFile(customWad.path);
        const header = buffer.toString("ascii", 0, 4);
        const allowedHeadersArr = allowedHeaders.split(",");
        if (!allowedHeadersArr.includes(header)) {
            throw new BadRequest("Invalid file: header mismatch.");
        }
        return;
    }

    public deleteCustomWad(entry: number, round: number): Promise<void>;

    public deleteCustomWad(entry: PlatformMulterFile): Promise<void>;

    public deleteCustomWad(entry: number | PlatformMulterFile, round?: number): Promise<void> {
        const toDelete = typeof entry === "number" ? `${this.basePath}/${round}/${entry}` : entry.path;
        return fs.promises.rm(toDelete, {recursive: true, force: true});
    }

    private checkFileExt(customWad: PlatformMulterFile): void {
        const fileExt = customWad.originalname.split(".").pop() ?? "";
        const allowedFilesArr = this.allowedFiles.split(",");
        if (!allowedFilesArr.includes(fileExt.toLowerCase())) {
            throw new BadRequest(`Invalid file: got ${fileExt}, expected: ${allowedFilesArr.join(", ")}`);
        }
    }

}
