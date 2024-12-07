import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { AbstractDao } from "./AbstractDao.js";
import { UserModel } from "../../model/db/User.model.js";
import { SQLITE_DATA_SOURCE } from "../../model/di/tokens.js";
import { DataSource, EntityManager } from "typeorm";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class UserDao extends AbstractDao<UserModel> {
    public constructor(@Inject(SQLITE_DATA_SOURCE) ds: DataSource) {
        super(ds, UserModel);
    }

    public getUser(email: string, transaction?: EntityManager): Promise<UserModel | null> {
        return this.getEntityManager(transaction).findOneBy({
            email,
        });
    }

    public getAllUsers(transaction?: EntityManager): Promise<UserModel[]> {
        return this.getEntityManager(transaction).find();
    }

    public saveOrUpdateUser(userModel: UserModel, transaction?: EntityManager): Promise<UserModel> {
        return this.getEntityManager(transaction).save(userModel);
    }
}
