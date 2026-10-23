import { Constant, Inject, Service } from "@tsed/di";
import { UserModel } from "../model/db/User.model.js";
import argon2 from "argon2";
import { CustomUserInfoModel } from "../model/auth/CustomUserInfoModel.js";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { UserRepo } from "../db/repo/UserRepo.js";
import { AfterInit } from "@tsed/common";
import crypto from "node:crypto";
import { Logger } from "@tsed/logger";
import GlobalEnv from "../model/constants/GlobalEnv.js";

@Service()
export class UserService implements AfterInit {
    @Constant(GlobalEnv.BOT_USER_EMAIL)
    private readonly botUserEmail: string;

    @Constant(GlobalEnv.BOT_USER_PASSWORD)
    private readonly botUserPassword: string;

    private dummyHash: string;

    public constructor(
        @Inject() private userRepo: UserRepo,
        @Inject() private logger: Logger,
    ) {}

    public async getUser(email: string, password: string): Promise<UserModel | null> {
        const userObject = await this.userRepo.getUser(email);
        // use safe timings compare to verify the hash matches
        const passwordMatches = await argon2.verify(userObject?.password ?? this.dummyHash, password);
        if (!userObject || !passwordMatches) {
            return null;
        }
        return userObject;
    }

    public isBotUser(user: UserModel): boolean {
        return user.email === this.botUserEmail;
    }

    public async changeDetails(newModel: UserModel, loggedInUser: CustomUserInfoModel): Promise<UserModel> {
        const userObject = await this.userRepo.getUser(loggedInUser.email);
        if (!userObject) {
            throw new Unauthorized("You are not logged in");
        }

        const emailOwner = await this.userRepo.getUser(newModel.email);
        if (emailOwner && emailOwner.id !== userObject.id) {
            throw new BadRequest("That email is already in use");
        }

        userObject.email = newModel.email;
        userObject.password = await argon2.hash(newModel.password);
        return this.userRepo.updateUser(userObject);
    }

    public async $afterInit(): Promise<void> {
        this.dummyHash = await argon2.hash(this.generatePassword());

        const allUsers = await this.userRepo.getAllUsers();
        const email = "foo@example.com";
        if (!allUsers || allUsers.length === 0) {
            const newPassword = this.generatePassword();
            const hashedPassword = await argon2.hash(newPassword);
            await this.userRepo.createUser(email, hashedPassword);
            this.logger.info(
                `New user created: email: "${email}" password: "${newPassword}" Please change this upon logging in!`,
            );
        } else {
            const entry = allUsers[0];
            if (entry.email === email) {
                this.logger.warn("Please change the default email/password!");
            }
        }

        await this.ensureBotUser();
    }

    private async ensureBotUser(): Promise<void> {
        if (!this.botUserEmail || !this.botUserPassword) {
            return;
        }

        const existing = await this.userRepo.getUser(this.botUserEmail);
        if (existing && (await argon2.verify(existing.password, this.botUserPassword))) {
            return;
        }

        const hashedPassword = await argon2.hash(this.botUserPassword);
        if (existing) {
            existing.password = hashedPassword;
            await this.userRepo.updateUser(existing);
            this.logger.info(`Bot user password updated: "${this.botUserEmail}"`);
            return;
        }

        await this.userRepo.createUser(this.botUserEmail, hashedPassword);
        this.logger.info(`Bot user created: "${this.botUserEmail}"`);
    }

    private generatePassword(): string {
        return crypto.webcrypto.getRandomValues(new BigUint64Array(1))[0].toString(36);
    }
}
