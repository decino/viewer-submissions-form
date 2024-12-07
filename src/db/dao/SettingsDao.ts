import { SettingsModel } from "../../model/db/Settings.model.js";
import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { AbstractDao } from "./AbstractDao.js";
import { Logger } from "@tsed/logger";
import { SQLITE_DATA_SOURCE } from "../../model/di/tokens.js";
import { DataSource, EntityManager, In } from "typeorm";
import SETTING from "../../model/constants/Settings.js";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class SettingsDao extends AbstractDao<SettingsModel> {
    @Inject()
    private logger: Logger;

    public constructor(@Inject(SQLITE_DATA_SOURCE) ds: DataSource) {
        super(ds, SettingsModel);
    }

    public saveOrUpdateSettings(settings: SettingsModel[], transaction?: EntityManager): Promise<SettingsModel[]> {
        const entityManager = this.getEntityManager(transaction);
        return entityManager.save(settings);
    }

    public saveOrUpdateSetting(setting: SettingsModel, transaction?: EntityManager): Promise<SettingsModel> {
        const entityManager = this.getEntityManager(transaction);
        return entityManager.save(setting);
    }

    public async deleteSetting(setting: SettingsModel, transaction?: EntityManager): Promise<boolean> {
        const entityManager = this.getEntityManager(transaction);
        try {
            await entityManager.delete(setting);
        } catch (e) {
            this.logger.error(e);
            return false;
        }
        return true;
    }

    public async hasSetting(setting: SETTING, transaction?: EntityManager): Promise<boolean> {
        const entityManager = this.getEntityManager(transaction);
        const count = await entityManager.countBy({
            setting,
        });
        return count !== 0;
    }

    public getSettings(settings: SETTING[], transaction?: EntityManager): Promise<SettingsModel[]> {
        return this.getEntityManager(transaction).findBy({
            setting: In(settings),
        });
    }

    public getSetting(setting: SETTING, transaction?: EntityManager): Promise<SettingsModel | null> {
        return this.getEntityManager(transaction).findOneBy({
            setting,
        });
    }
}
