import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { AbstractDao } from "./AbstractDao.js";
import { SessionModel } from "../../model/db/Session.model.js";
import { SQLITE_DATA_SOURCE } from "../../model/di/tokens.js";
import { DataSource, EntityManager } from "typeorm";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class SessionDao extends AbstractDao<SessionModel> {
    public constructor(@Inject(SQLITE_DATA_SOURCE) ds: DataSource) {
        super(ds, SessionModel);
    }

    public deleteAllSessions(transaction?: EntityManager): Promise<void> {
        return this.getEntityManager(transaction).clear();
    }
}
