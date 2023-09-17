import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {SubmissionRoundModel} from "../../model/db/SubmissionRound.model";
import {SubmissionRoundDao} from "../dao/SubmissionRoundDao";
import {Builder} from "builder-pattern";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class SubmissionRoundRepo {

    @Inject()
    private submissionRoundDao: SubmissionRoundDao;

    public createRound(name: string, endDate: Date | null): Promise<SubmissionRoundModel> {
        const model = Builder(SubmissionRoundModel)
            .active(true)
            .name(name)
            .endDate(endDate)
            .build();
        return this.submissionRoundDao.createRound(model);
    }

    public retrieveActiveRound(): Promise<SubmissionRoundModel | null> {
        return this.submissionRoundDao.retrieveActiveRound();
    }

    public retrieveRound(roundId: number): Promise<SubmissionRoundModel | null> {
        return this.submissionRoundDao.retrieveRound(roundId);
    }

    public async deleteRound(round: number | SubmissionRoundModel): Promise<boolean> {
        if (typeof round === "number") {
            const existingRound = await this.submissionRoundDao.retrieveRound(round);
            if (!existingRound) {
                return false;
            }
            return this.submissionRoundDao.deleteRound(existingRound);
        }
        return this.submissionRoundDao.deleteRound(round);
    }

    public getAllRounds(includeActive = true): Promise<SubmissionRoundModel[]> {
        return this.submissionRoundDao.getAllRounds(includeActive);
    }

    public endActiveRound(): Promise<boolean> {
        return this.submissionRoundDao.dataSource.transaction(async entityManager => {
            const currentActiveRound = await this.submissionRoundDao.retrieveActiveRound(entityManager);
            if (!currentActiveRound) {
                return false;
            }

            // TODO: remove invalid entries
            currentActiveRound.active = false;
            await this.submissionRoundDao.saveOrUpdateRounds(currentActiveRound, entityManager);
            return true;
        });
    }

    public async pauseRound(pause: boolean): Promise<void> {
        const currentActiveRound = await this.retrieveActiveRound();
        if (!currentActiveRound) {
            throw new Error("No active round to pause.");
        }
        currentActiveRound.paused = pause;

        await this.submissionRoundDao.saveOrUpdateRounds(currentActiveRound);
    }

    public saveOrUpdateRounds(models: SubmissionRoundModel): Promise<SubmissionRoundModel>;
    public saveOrUpdateRounds(models: SubmissionRoundModel[]): Promise<SubmissionRoundModel[]>;
    public saveOrUpdateRounds(models: SubmissionRoundModel | SubmissionRoundModel[]): Promise<SubmissionRoundModel | SubmissionRoundModel[]> {
        return this.submissionRoundDao.saveOrUpdateRounds(models);
    }
}
