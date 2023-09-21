import {Inject, Service} from "@tsed/di";
import {UserModel} from "../model/db/User.model";
import argon2 from "argon2";
import {CustomUserInfoModel} from "../model/auth/CustomUserInfoModel";
import {Logger} from "@tsed/logger";
import {AfterInit} from "@tsed/common";
import * as crypto from "crypto";
import {Unauthorized} from "@tsed/exceptions";
import {UserRepo} from "../db/repo/UserRepo";

@Service()
export class UsersService implements AfterInit {

    @Inject()
    private userRepo: UserRepo;

    @Inject()
    private logger: Logger;

    public async getUser(email: string, password: string): Promise<UserModel | null> {
        const userObject = await this.userRepo.getUser(email);
        // use safe timings compare to verify the hash matches
        if (!userObject || !await argon2.verify(userObject.password, password)) {
            return null;
        }
        return userObject;
    }

    public async changeDetails(newModel: UserModel, loggedInUser: CustomUserInfoModel): Promise<UserModel> {
        const userObject = await this.userRepo.getUser(loggedInUser.email);
        if (!userObject) {
            throw new Unauthorized("You are not logged in");
        }
        userObject.email = newModel.email;
        userObject.password = await argon2.hash(newModel.password);
        return this.userRepo.updateUser(userObject);
    }

    public async $afterInit(): Promise<void> {
        const allUsers = await this.userRepo.getAllUsers();
        const email = "foo@example.com";
        if (!allUsers || allUsers.length === 0) {
            const newPassword = this.generatePassword();
            const hashedPassword = await argon2.hash(newPassword);
            await this.userRepo.createUser(email, hashedPassword);
            this.logger.info(`New user created: email: "${email}" password: "${newPassword}" Please change this upon logging in!`);
            return;
        }
        const entry = allUsers[0];
        if (entry.email === email) {
            this.logger.warn("Please change the default email/password!");
        }
    }

    private generatePassword(): string {
        return crypto.webcrypto.getRandomValues(new BigUint64Array(1))[0].toString(36);
    }
}
