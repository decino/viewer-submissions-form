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
        const userObject = await this.ds.manager.findOne(UserModel, {
            where: {
                email
            }
        });
        // use safe timings compare to verify the hash matches
        if (!userObject || !await argon2.verify(userObject.password, password)) {
            return null;
        }
        return userObject;
    }
}
