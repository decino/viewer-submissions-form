import {Constant, Inject, OnInit, Service} from "@tsed/di";
import SETTING from "../model/constants/Settings";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SettingsModel} from "../model/db/Settings.model";
import GlobalEnv from "../model/constants/GlobalEnv";
import {Logger} from "@tsed/common";

@Service()
export class SettingsService implements OnInit {

    @Constant(GlobalEnv.ALLOWED_HEADERS)
    private readonly defaultAllowedHeaders: string;

    @Constant(GlobalEnv.ALLOWED_FILES)
    private readonly defaultAllowedFiles: string;

    @Constant(GlobalEnv.ALLOWED_FILES_ZIP)
    private readonly defaultAllowedFilesZip: string;

    @Constant(GlobalEnv.ALLOWED_HEADERS_ZIP)
    private readonly defaultAllowedHeadersZip: string;

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private logger: Logger;

    public async getSetting(setting: SETTING): Promise<string | null> {
        const repo = this.ds.getRepository(SettingsModel);
        const value = await repo.findOneBy({
            setting
        });
        return value?.value ?? null;
    }

    public async hasSetting(setting: SETTING): Promise<boolean> {
        const repo = this.ds.getRepository(SettingsModel);
        const value = await repo.countBy({
            setting
        });
        return value !== 0;
    }

    public async saveOrUpdateSetting(setting: SETTING, value: string): Promise<void> {
        const repo = this.ds.getRepository(SettingsModel);
        let obj = await repo.findOneBy({
            setting
        });
        if (!obj) {
            obj = repo.create({
                setting,
                value
            });
        } else {
            obj.value = value;
        }
        await repo.save(obj);
    }

    public async deleteSetting(setting: SETTING): Promise<boolean> {
        const repo = this.ds.getRepository(SettingsModel);
        const obj = await repo.findOneBy({
            setting
        });
        if (!obj) {
            throw new Error(`Unable to find setting`);
        }
        const result = await repo.remove(obj);
        return result !== null;
    }

    public async $onInit(): Promise<void> {
        this.logger.info("Setting default settings...");

        const hasAllowedHeaders = await this.hasSetting(SETTING.ALLOWED_HEADERS);
        const hasAllowedHeadersZip = await this.hasSetting(SETTING.ALLOWED_HEADERS_ZIP);
        const hasAllowedFiles = await this.hasSetting(SETTING.ALLOWED_FILES);
        const hasAllowedFilesZip = await this.hasSetting(SETTING.ALLOWED_FILES_ZIP);

        if (!hasAllowedHeaders) {
            this.logger.info("Settings Allowed headers");
            await this.saveOrUpdateSetting(SETTING.ALLOWED_HEADERS, this.defaultAllowedHeaders);
        }

        if (!hasAllowedHeadersZip) {
            this.logger.info("Settings Allowed headers zip");
            await this.saveOrUpdateSetting(SETTING.ALLOWED_HEADERS_ZIP, this.defaultAllowedHeadersZip);
        }

        if (!hasAllowedFiles) {
            this.logger.info("Settings Allowed files");
            await this.saveOrUpdateSetting(SETTING.ALLOWED_FILES, this.defaultAllowedFiles);
        }

        if (!hasAllowedFilesZip) {
            this.logger.info("Settings Allowed files zip");
            await this.saveOrUpdateSetting(SETTING.ALLOWED_FILES_ZIP, this.defaultAllowedFilesZip);
        }

    }
}
