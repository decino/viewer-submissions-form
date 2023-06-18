import {Inject, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {UserModel} from "../model/db/User.model";
import argon2 from "argon2";
import {CustomUserInfoModel} from "../model/auth/CustomUserInfoModel";
import {Logger} from "@tsed/logger";
import {AfterInit} from "@tsed/common";
import * as crypto from "crypto";
import {Unauthorized} from "@tsed/exceptions";

@Service()
export class UsersService implements AfterInit {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private logger: Logger;

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

    public async changeDetails(newModel: UserModel, loggedInUser: CustomUserInfoModel): Promise<UserModel> {
        const userObject = await this.ds.manager.findOne(UserModel, {
            where: {
                email: loggedInUser.email
            }
        });
        if (!userObject) {
            throw new Unauthorized("You are not logged in");
        }
        userObject.email = newModel.email;
        userObject.password = await argon2.hash(newModel.password);
        return this.ds.manager.save(userObject);
    }

    public async $afterInit(): Promise<void> {
        const repo = this.ds.getRepository(UserModel);
        const entries = await repo.find();
        const email = "foo@example.com";
        if (!entries || entries.length === 0) {
            const newPassword = this.generatePassword();
            const hashedPassword = await argon2.hash(newPassword);
            const newUser = repo.create({
                email,
                password: hashedPassword
            });
            await repo.save(newUser);
            this.logger.info(`New user created: email: "${email}" password: "${newPassword}" Please change this upon logging in!`);
            return;
        }
        const entry = entries[0];
        if (entry.email === email) {
            this.logger.warn("Please change the default email/password!");
        }
    }

    private generatePassword(): string {
        return crypto.webcrypto.getRandomValues(new BigUint64Array(1))[0].toString(36);
    }
}
