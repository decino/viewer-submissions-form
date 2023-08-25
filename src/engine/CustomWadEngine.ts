import {Constant, Injectable, ProviderScope} from "@tsed/di";
import fs from "fs";
import {PlatformMulterFile} from "@tsed/common";
import GlobalEnv from "../model/constants/GlobalEnv";
import {BadRequest} from "@tsed/exceptions";
import AdmZip, {IZipEntry} from "adm-zip";

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

    @Constant(GlobalEnv.ALLOWED_FILES_ZIP)
    private readonly allowedFilesZip: string;

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
        const fileExt = customWad.originalname.split(".").pop() ?? "";
        if (fileExt === "zip") {
            await this.analyseZip(customWad);
        }
        const buffer = await fs.promises.readFile(customWad.path);
        this.checkHeaders(buffer);
    }

    public deleteCustomWad(entry: number, round: number): Promise<void>;
    public deleteCustomWad(entry: PlatformMulterFile): Promise<void>;
    public deleteCustomWad(entry: number | PlatformMulterFile, round?: number): Promise<void> {
        const toDelete = typeof entry === "number" ? `${this.basePath}/${round}/${entry}` : entry.path;
        return fs.promises.rm(toDelete, {recursive: true, force: true});
    }

    private checkHeaders(buffer: Buffer, isZip = false): void {
        const allowedHeaders = this.allowedHeaders;
        if (!allowedHeaders) {
            return;
        }
        const header = buffer.toString("ascii", 0, 4);
        const allowedHeadersArr = allowedHeaders.split(",");
        if (!allowedHeadersArr.includes(header)) {
            if (isZip) {
                throw new BadRequest("Invalid file inside of ZIP: header mismatch.");
            }
            throw new BadRequest("Invalid file: header mismatch.");
        }
    }

    private checkFileExt(customWad: PlatformMulterFile | string, isZip = false): void {
        const fileName = typeof customWad === "string" ? customWad : customWad.originalname;
        const fileExt = fileName.split(".").pop()?.toLowerCase() ?? "";
        const allowedFilesArr = isZip ? this.allowedFilesZip.split(",") : this.allowedFiles.split(",");
        if (!allowedFilesArr.includes(fileExt)) {
            if (isZip) {
                throw new BadRequest(`Invalid file found inside of ZIP: got ${fileExt}, expected: ${allowedFilesArr.join(", ")}`);
            }
            throw new BadRequest(`Invalid file: got ${fileExt}, expected: ${allowedFilesArr.join(", ")}`);
        }
    }

    private async analyseZip(customWad: PlatformMulterFile): Promise<void> {
        const buffer = await fs.promises.readFile(customWad.path);
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        for (const entry of entries) {
            this.checkFileExt(entry.entryName, true);
            if (this.isExt(entry.entryName, "txt") || this.isExt(entry.entryName, "deh")) {
                continue;
            }
            const buff = await this.getZipData(entry);
            this.checkHeaders(buff, true);
        }
    }

    private getZipData(entry: IZipEntry): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            entry.getDataAsync((data, err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }

    private isExt(customWad: PlatformMulterFile | string, ext: string): boolean {
        const fileName = typeof customWad === "string" ? customWad : customWad.originalname;
        const fileExt = fileName.split(".").pop() ?? "";
        return fileExt.toLowerCase() === ext;
    }

}
