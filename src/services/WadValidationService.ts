import {Inject, Service} from "@tsed/di";
import {WadValidationModel} from "../model/rest/wadValidationModel";
import SETTING from "../model/constants/Settings";
import {SettingsService} from "./SettingsService";
import {AfterInit, Logger, PlatformMulterFile} from "@tsed/common";
import fs from "fs";
import {BadRequest} from "@tsed/exceptions";
import AdmZip, {IZipEntry} from "adm-zip";

@Service()
export class WadValidationService implements AfterInit {

    @Inject()
    private settingsService: SettingsService;

    @Inject()
    private logger: Logger;

    // map of file extension to header BOM
    private allowedFilesMap: Map<string, string | null> = new Map();

    // map of file extension to header BOM for zips only
    private allowedFilesZipMap: Map<string, string | null> = new Map();

    public async $afterInit(): Promise<void> {
        this.logger.info("Loading wad validation settings...");
        await this.loadMappings();
    }

    public async setValidation(model: WadValidationModel): Promise<void> {
        const {allowedExtensionsZip, allowedHeadersZip, allowedHeaders, allowedExtensions} = model;
        const allowedHeadersStr = allowedHeaders.join(",");
        const allowedExtensionsStr = allowedExtensions.join(",");
        const allowedZipHeaders = allowedHeadersZip.join(",");
        const allowedZipExtensions = allowedExtensionsZip.join(",");
        await this.settingsService.saveOrUpdateSetting(SETTING.ALLOWED_FILES, allowedExtensionsStr);
        await this.settingsService.saveOrUpdateSetting(SETTING.ALLOWED_HEADERS, allowedHeadersStr);
        await this.settingsService.saveOrUpdateSetting(SETTING.ALLOWED_FILES_ZIP, allowedZipExtensions);
        await this.settingsService.saveOrUpdateSetting(SETTING.ALLOWED_HEADERS_ZIP, allowedZipHeaders);
        await this.loadMappings();
    }

    public async getValidationMappings(): Promise<WadValidationModel> {
        const retVal = new WadValidationModel();

        const allowedHeaders = await this.settingsService.getSetting(SETTING.ALLOWED_HEADERS);
        const allowedFiles = await this.settingsService.getSetting(SETTING.ALLOWED_FILES);
        const allowedFilesZip = await this.settingsService.getSetting(SETTING.ALLOWED_FILES_ZIP);
        const allowedHeadersZip = await this.settingsService.getSetting(SETTING.ALLOWED_HEADERS_ZIP);

        if (allowedHeaders) {
            retVal.allowedHeaders = allowedHeaders.split(",")
                .map(header => encodeURIComponent(header))
                .map(ext => ext === "null" ? null : ext);
        }
        if (allowedFiles) {
            retVal.allowedExtensions = allowedFiles.split(",");
        }
        if (allowedFilesZip) {
            retVal.allowedExtensionsZip = allowedFilesZip.split(",");
        }
        if (allowedHeadersZip) {
            retVal.allowedHeadersZip = allowedHeadersZip.split(",")
                .map(header => encodeURIComponent(header))
                .map(ext => ext === "null" ? null : ext);
        }
        return retVal;
    }

    public async validateWad(customWad: PlatformMulterFile): Promise<void> {

        // no validation defined
        if (this.allowedFilesMap.size === 0 && this.allowedFilesZipMap.size === 0) {
            return;
        }

        this.checkFileExt(customWad, false);
        const fileExt = this.getFileExt(customWad);
        if (fileExt === "ZIP") {
            await this.analyseZip(customWad);
        }
        const buffer = await fs.promises.readFile(customWad.path);
        this.checkHeaders(buffer, false, fileExt);
    }

    private async loadMappings(): Promise<void> {
        const [filesMap, filesZipMap] = await this.getMappings();
        this.allowedFilesMap = filesMap;
        this.allowedFilesZipMap = filesZipMap;
    }

    private async getMappings(): Promise<[Map<string, string | null>, Map<string, string | null>]> {
        const mappings = await this.getHeaderMapping(false);
        const zipMappings = await this.getHeaderMapping(true);
        return [mappings, zipMappings];
    }

    private async getHeaderMapping(zip: boolean): Promise<Map<string, string | null>> {
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

    private mapExtensions(extensions: string, headers: string | null): Map<string, string | null> {
        const retMap: Map<string, string | null> = new Map();
        const extensionsArr = extensions.toUpperCase().split(",");
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
        const map = isZip ? this.allowedFilesZipMap : this.allowedFilesMap;
        if (map.size === 0) {
            return;
        }
        const allowedHeaders = map.get(ext);
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
            this.logger.error(`validation failure: File uploaded declares itself as a ${ext}, but the header of the file is ${header}`);
            if (isZip) {
                throw new BadRequest("Invalid file inside of ZIP: header mismatch.");
            }
            throw new BadRequest("Invalid file: header mismatch.");
        }
    }

    private checkFileExt(customWad: PlatformMulterFile | string, isZip: boolean): void {
        const fileExt = this.getFileExt(customWad);
        const map = isZip ? this.allowedFilesZipMap : this.allowedFilesMap;
        if (map.size === 0) {
            return;
        }
        const allowedFilesArr = map.has(fileExt);
        if (!allowedFilesArr) {
            const allowedAllFiles = [...map.keys()];
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
            const fileName = entry.entryName;
            this.checkFileExt(fileName, true);
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
