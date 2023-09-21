import {Constant, Inject, OnInit, Service} from "@tsed/di";
import SETTING from "../model/constants/Settings";
import GlobalEnv from "../model/constants/GlobalEnv";
import {Logger} from "@tsed/common";
import {SettingsRepo} from "../db/repo/SettingsRepo";

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

    @Inject()
    private logger: Logger;

    @Inject()
    private settingRepo: SettingsRepo;

    public async getSetting(setting: SETTING): Promise<string | null> {
        const settingModel = await this.settingRepo.getSetting(setting);
        return settingModel?.value ?? null;
    }

    public async hasSetting(setting: SETTING): Promise<boolean> {
        return this.settingRepo.hasSetting(setting);
    }

    public async saveOrUpdateSetting(setting: SETTING, value: string): Promise<void> {
        await this.settingRepo.saveOrUpdateSetting(setting, value);
    }

    public deleteSetting(setting: SETTING): Promise<boolean> {
        return this.settingRepo.deleteSetting(setting);
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
