import {Inject, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {UserModel} from "../model/db/User.model";
import sha256 from "sha256";

@Service()
export class UsersService {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    public async getUser(email: string, password: string): Promise<UserModel | null> {
        const hash = sha256(password);
        const userObject = await this.ds.manager.findOne(UserModel, {
            where: {
                email,
                password: hash
            }
        });
        if (!userObject) {
            return null;
        }
        return userObject;
    }
}
