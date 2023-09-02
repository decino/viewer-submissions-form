import {Inject, Injectable, ProviderScope} from "@tsed/di";
import fs from "fs";
import {PlatformMulterFile} from "@tsed/common";
import {BadRequest} from "@tsed/exceptions";
import AdmZip, {IZipEntry} from "adm-zip";
import {SettingsService} from "../services/SettingsService";
import SETTING from "../model/constants/Settings";

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

    // map of file extension to header BOM
    private allowedFilesMap: Map<string, string | null> = new Map();

    // map of file extension to header BOM for zips only
    private allowedFilesZipMap: Map<string, string | null> = new Map();


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

    public async getHeaderMapping(zip: boolean): Promise<Map<string, string | null>> {
        let extensions: string | null;
        if (zip) {
            extensions = await this.settingsService.getSetting(SETTING.ALLOWED_FILES_ZIP);
        } else {
            extensions = await this.settingsService.getSetting(SETTING.ALLOWED_FILES);
        }
        if (!extensions) {
            return new Map();
        }
        let headers: string | null;
        if (zip) {
            headers = await this.settingsService.getSetting(SETTING.ALLOWED_HEADERS_ZIP);
        } else {
            headers = await this.settingsService.getSetting(SETTING.ALLOWED_HEADERS);
        }
        return this.mapExtensions(extensions, headers);
    }


    public async moveWad(entryId: number, customWad: PlatformMulterFile, round: number): Promise<void> {
        const newFolder = `${this.basePath}/${round}/${entryId}`;
        await fs.promises.mkdir(newFolder, {recursive: true});
        return fs.promises.rename(customWad.path, `${newFolder}/${customWad.originalname}`);
    }

    public async validateWad(customWad: PlatformMulterFile): Promise<void> {
        this.allowedFilesMap = await this.getHeaderMapping(false);
        this.allowedFilesZipMap = await this.getHeaderMapping(true);

        this.checkFileExt(customWad, false);
        const fileExt = this.getFileExt(customWad);
        if (fileExt === "ZIP") {
            await this.analyseZip(customWad);
        }
        const buffer = await fs.promises.readFile(customWad.path);
        this.checkHeaders(buffer, false, fileExt);
    }

    public deleteCustomWad(entry: number, round: number): Promise<void>;
    public deleteCustomWad(entry: PlatformMulterFile): Promise<void>;
    public deleteCustomWad(entry: number | PlatformMulterFile, round?: number): Promise<void> {
        const toDelete = typeof entry === "number" ? `${this.basePath}/${round}/${entry}` : entry.path;
        return fs.promises.rm(toDelete, {recursive: true, force: true});
    }

    private mapExtensions(extensions: string, headers: string | null): Map<string, string | null> {
        const retMap: Map<string, string | null> = new Map();
        const extensionsArr = extensions.split(",").map(f => f.toUpperCase());
        if (!headers) {
            for (const extension of extensionsArr) {
                retMap.set(extension, null);
            }
            return retMap;
        }
        const headersArr = headers.split(",");
        for (let i = 0; i < extensionsArr.length; i++) {
            const extension = extensionsArr[i];
            let headerMapping: string | null = headersArr[i];
            if (headerMapping === "null") {
                headerMapping = null;
            }
            retMap.set(extension, headerMapping);
        }
        return retMap;
    }

    private checkHeaders(buffer: Buffer, isZip: boolean, ext: string): void {
        const allowedHeaders = isZip ? this.allowedFilesZipMap.get(ext) : this.allowedFilesMap.get(ext);
        if (allowedHeaders === null) {
            // no mapping for header
            return;
        } else if (allowedHeaders === undefined) {
            // should never happen. this means the extension is not in the allowed files map
            throw new BadRequest("Unable to map extension to an header BOM");
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

    private checkFileExt(customWad: PlatformMulterFile | string, isZip: boolean): void {
        const fileExt = this.getFileExt(customWad);
        const map = isZip ? this.allowedFilesZipMap : this.allowedFilesMap;
        const allowedFilesArr = map.has(fileExt);
        const allowedAllFiles = [...map.keys()];
        if (!allowedFilesArr) {
            if (isZip) {
                throw new BadRequest(`Invalid file found inside of ZIP: got ${fileExt}, expected: ${allowedAllFiles.join(", ")}`);
            }
            throw new BadRequest(`Invalid file: got ${fileExt}, expected: ${allowedAllFiles.join(", ")}`);
        }
    }

    private getFileExt(customWad: PlatformMulterFile | string): string {
        const fileName = typeof customWad === "string" ? customWad : customWad.originalname;
        const fileExt = fileName.split(".").pop()?.toLowerCase() ?? "";
        return fileExt.toUpperCase();
    }

    private async analyseZip(customWad: PlatformMulterFile): Promise<void> {
        const buffer = await fs.promises.readFile(customWad.path);
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        for (const entry of entries) {
            this.checkFileExt(entry.entryName, true);
            const fileName = entry.entryName;
            const fileExt = this.getFileExt(fileName);
            const buff = await this.getZipData(entry);
            this.checkHeaders(buff, true, fileExt);
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
}
