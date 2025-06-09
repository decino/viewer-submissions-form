import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { Builder } from "builder-pattern";
import type { UUID } from "crypto";
import { BotDownloadAuthenticationModel } from "../../model/db/BotDownloadAuthentication.model.js";
import { BotDownloadAuthenticationDao } from "../dao/BotDownloadAuthenticationDao.js";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class BotDownloadAuthenticationRepo {
    @Inject()
    private botDownloadAuthenticationDao: BotDownloadAuthenticationDao;

    public createAuth(submissionId: number): Promise<BotDownloadAuthenticationModel> {
        const entry = Builder(BotDownloadAuthenticationModel).submissionId(submissionId).build();
        return this.botDownloadAuthenticationDao.createAuth(entry);
    }

    public getAuth(confirmationUid: UUID): Promise<BotDownloadAuthenticationModel | null> {
        return this.botDownloadAuthenticationDao.getAuth(confirmationUid);
    }

    public deleteAuth(confirmation: BotDownloadAuthenticationModel): Promise<boolean> {
        return this.botDownloadAuthenticationDao.deleteAuth(confirmation);
    }
}
