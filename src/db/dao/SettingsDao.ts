import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {AbstractDao} from "./AbstractDao";
import {SettingsModel} from "../../model/db/Settings.model";
import {SQLITE_DATA_SOURCE} from "../../model/di/tokens";
import {DataSource, EntityManager} from "typeorm";
import {Logger} from "@tsed/logger";
import SETTING from "../../model/constants/Settings";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class SettingsDao extends AbstractDao<SettingsModel> {

    @Inject()
    private logger: Logger;

    public constructor(@Inject(SQLITE_DATA_SOURCE) ds: DataSource) {
        super(ds, SettingsModel);
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
            setting
        });
        return count !== 0;
    }

    public getSetting(setting: SETTING, transaction?: EntityManager): Promise<SettingsModel | null> {
        return this.getEntityManager(transaction).findOneBy({
            setting
        });
    }

}
