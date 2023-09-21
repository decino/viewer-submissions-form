import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {SettingsDao} from "../dao/SettingsDao";
import {SettingsModel} from "../../model/db/Settings.model";
import SETTING from "../../model/constants/Settings";
import {Builder} from "builder-pattern";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class SettingsRepo {

    @Inject()
    private settingsDao: SettingsDao;

    public async saveOrUpdateSetting(setting: SETTING, value: string): Promise<SettingsModel> {
        let settingToSave = await this.settingsDao.getSetting(setting);
        if (!settingToSave) {
            settingToSave = Builder(SettingsModel)
                .setting(setting)
                .value(value)
                .build();
        } else {
            settingToSave.value = value;
        }
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

    public getSetting(setting: SETTING): Promise<SettingsModel | null> {
        return this.settingsDao.getSetting(setting);
    }

}
