import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { UserDao } from "../dao/UserDao.js";
import { SessionDao } from "../dao/SessionDao.js";
import { UserModel } from "../../model/db/User.model.js";
import { Builder } from "builder-pattern";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class UserRepo {
    @Inject()
    private userDao: UserDao;

    @Inject()
    private sessionDao: SessionDao;

    public getUser(email: string): Promise<UserModel | null> {
        return this.userDao.getUser(email);
    }

    public getAllUsers(): Promise<UserModel[]> {
        return this.userDao.getAllUsers();
    }

    public createUser(email: string, password: string): Promise<UserModel> {
        const model = Builder(UserModel).email(email).password(password).build();
        return this.userDao.saveOrUpdateUser(model);
    }

    public updateUser(user: UserModel): Promise<UserModel> {
        return this.userDao.dataSource.transaction(async entityManager => {
            await this.sessionDao.deleteAllSessions(entityManager);
            return this.userDao.saveOrUpdateUser(user, entityManager);
        });
    }
}
