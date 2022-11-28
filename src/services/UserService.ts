import {Inject, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {UserModel} from "../model/db/User.model";
import * as argon2 from "argon2";

@Service()
export class UsersService {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    public async getUser(email: string, password: string): Promise<UserModel | null> {
        const passwordHash = await argon2.hash(password);
        const userObject = await this.ds.manager.findOne(UserModel, {
            where: {
                email,
                password: passwordHash
            }
        });
        if (!userObject) {
            return null;
        }
        return userObject;
    }
}
