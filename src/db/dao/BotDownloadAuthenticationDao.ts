import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { AbstractDao } from "./AbstractDao.js";
import { Logger } from "@tsed/logger";
import { SQLITE_DATA_SOURCE } from "../../model/di/tokens.js";
import { DataSource, EntityManager } from "typeorm";
import type { UUID } from "crypto";
import { BotDownloadAuthenticationModel } from "../../model/db/BotDownloadAuthentication.model.js";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class BotDownloadAuthenticationDao extends AbstractDao<BotDownloadAuthenticationModel> {
    @Inject()
    private logger: Logger;

    public constructor(@Inject(SQLITE_DATA_SOURCE) ds: DataSource) {
        super(ds, BotDownloadAuthenticationModel);
    }

    public createAuth(
        botDownloadAuthenticationModel: BotDownloadAuthenticationModel,
        transaction?: EntityManager,
    ): Promise<BotDownloadAuthenticationModel> {
        return this.getEntityManager(transaction).save(botDownloadAuthenticationModel);
    }

    public getAuth(token: UUID, transaction?: EntityManager): Promise<BotDownloadAuthenticationModel | null> {
        return this.getEntityManager(transaction).findOne({
            where: {
                token,
            },
            relations: ["submission", "submission.submissionRound"],
        });
    }

    public async deleteAuth(authModel: BotDownloadAuthenticationModel, transaction?: EntityManager): Promise<boolean> {
        try {
            await this.getEntityManager(transaction).remove(authModel);
        } catch (e) {
            this.logger.error(e);
            return false;
        }
        return true;
    }
}
