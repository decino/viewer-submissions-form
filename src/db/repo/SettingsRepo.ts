import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { SettingsDao } from "../dao/SettingsDao.js";
import { SettingsMap } from "../../utils/typeings.js";
import { SettingsModel } from "../../model/db/Settings.model.js";
import SETTING from "../../model/constants/Settings.js";
import { Builder } from "builder-pattern";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class SettingsRepo {
    @Inject()
    private settingsDao: SettingsDao;

    public async saveOrUpdateSettings(settingMap: SettingsMap): Promise<SettingsModel[]> {
        const settingsToUpdatePromises: Promise<SettingsModel>[] = [];
        for (const [setting, value] of settingMap) {
            settingsToUpdatePromises.push(this.getSettingToUpdate(setting, value));
        }
        const settingsToUpdate = await Promise.all(settingsToUpdatePromises);
        return this.settingsDao.saveOrUpdateSettings(settingsToUpdate);
    }

    public async saveOrUpdateSetting(setting: SETTING, value: string): Promise<SettingsModel> {
        const settingToSave = await this.getSettingToUpdate(setting, value);
        return this.settingsDao.saveOrUpdateSetting(settingToSave);
    }

    public async deleteSetting(setting: SETTING): Promise<boolean> {
        const settingToDelete = await this.settingsDao.getSetting(setting);
        if (!settingToDelete) {
            throw new Error("Unable to find setting");
        }
        return this.settingsDao.deleteSetting(settingToDelete);
    }

    public hasSetting(setting: SETTING): Promise<boolean> {
        return this.settingsDao.hasSetting(setting);
    }

    public getSettings(settings: SETTING[]): Promise<SettingsModel[]> {
        return this.settingsDao.getSettings(settings);
    }

    public getSetting(setting: SETTING): Promise<SettingsModel | null> {
        return this.settingsDao.getSetting(setting);
    }

    private async getSettingToUpdate(setting: SETTING, value: string): Promise<SettingsModel> {
        let settingToSave = await this.settingsDao.getSetting(setting);
        if (!settingToSave) {
            settingToSave = Builder(SettingsModel).setting(setting).value(value).build();
        } else {
            settingToSave.value = value;
        }
        return settingToSave;
    }
}
